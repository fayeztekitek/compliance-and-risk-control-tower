import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { pool, query } from "../config/database.js";
import { AppError, UnauthorizedError, ConflictError, NotFoundError } from "../core/errors.js";
import { logger } from "../core/logger.js";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  password_hash: string;
  refresh_token_hash: string | null;
}

interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const BCRYPT_ROUNDS = 12;

function generateTokens(userId: string, role: string): AuthTokens {
  const token = jwt.sign(
    { sub: userId, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
  const refreshToken = jwt.sign(
    { sub: userId, type: "refresh" },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
  const expiresIn = parseTimeToSeconds(env.JWT_EXPIRES_IN);
  return { token, refreshToken, expiresIn };
}

function parseTimeToSeconds(time: string): number {
  const match = time.match(/^(\d+)([smhd])$/);
  if (!match) return 3600;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 3600;
    case "d": return value * 86400;
    default: return 3600;
  }
}

export const authService = {
  async register(name: string, email: string, password: string, role: string = "EXECUTIVE_READ_ONLY"): Promise<UserProfile> {
    const existing = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (parseInt(existing.rows[0].count, 10) > 0) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await query<UserRow>(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, status`,
      [name, email.toLowerCase(), passwordHash, role]
    );
    const user = result.rows[0];
    logger.info({ userId: user.id, role: user.role }, "User registered");
    return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
  },

  async login(email: string, password: string): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const result = await query<UserRow>(
      "SELECT id, name, email, role, status, password_hash, refresh_token_hash FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) {
      throw new UnauthorizedError("Invalid email or password");
    }
    const user = result.rows[0];
    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError("Account is inactive");
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const tokens = generateTokens(user.id, user.role);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);
    await query(
      "UPDATE users SET refresh_token_hash = $1 WHERE id = $2",
      [refreshHash, user.id]
    );

    logger.info({ userId: user.id, role: user.role }, "User logged in");
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
      tokens,
    };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: { sub: string; type: string };
    try {
      payload = jwt.verify(refreshToken, env.JWT_SECRET) as any;
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
    if (payload.type !== "refresh") {
      throw new UnauthorizedError("Invalid token type");
    }

    const result = await query<UserRow>(
      "SELECT id, role, refresh_token_hash FROM users WHERE id = $1 AND status = 'ACTIVE'",
      [payload.sub]
    );
    if (result.rows.length === 0) {
      throw new UnauthorizedError("User not found or inactive");
    }
    const user = result.rows[0];

    if (user.refresh_token_hash) {
      const valid = await bcrypt.compare(refreshToken, user.refresh_token_hash);
      if (!valid) {
        throw new UnauthorizedError("Refresh token revoked");
      }
    }

    const tokens = generateTokens(user.id, user.role);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, BCRYPT_ROUNDS);
    await query("UPDATE users SET refresh_token_hash = $1 WHERE id = $2", [refreshHash, user.id]);

    return tokens;
  },

  async logout(userId: string): Promise<void> {
    await query("UPDATE users SET refresh_token_hash = NULL WHERE id = $1", [userId]);
    logger.info({ userId }, "User logged out");
  },

  async getProfile(userId: string): Promise<UserProfile> {
    const result = await query<UserRow>(
      "SELECT id, name, email, role, status FROM users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundError("User", userId);
    }
    const user = result.rows[0];
    return { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
  },

  async seedDefaultUsers(): Promise<void> {
    const existing = await query<{ count: string }>("SELECT COUNT(*) as count FROM users");
    if (parseInt(existing.rows[0].count, 10) > 0) return;

    const defaultUsers = [
      { id: "usr-001", name: "Fayez Tekitek", email: "fayez.tekitek@vermeg.com", role: "ADMIN", password: "admin123!" },
      { id: "usr-002", name: "Amandine Rousset", email: "amandine.rousset@vermeg.com", role: "COMPLIANCE_OFFICER", password: "compliance123!" },
      { id: "usr-003", name: "Marc-Antoine Dubois", email: "m.dubois@vermeg.com", role: "RISK_MANAGER", password: "risk123!" },
      { id: "usr-004", name: "Thomas Lemaire", email: "t.lemaire@vermeg.com", role: "SECURITY_MANAGER", password: "security123!" },
      { id: "usr-005", name: "Sarah Laroche", email: "s.laroche@vermeg.com", role: "PRODUCT_OWNER", password: "product123!" },
      { id: "usr-006", name: "Julien Mercer", email: "j.mercer@vermeg.com", role: "AUDITOR", password: "auditor123!" },
      { id: "usr-007", name: "Jean-Pierre Vermeg", email: "jp.v@vermeg.com", role: "EXECUTIVE_READ_ONLY", password: "exec123!" },
    ];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const u of defaultUsers) {
        const hash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
        await client.query(
          `INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
          [u.id, u.name, u.email, hash, u.role]
        );
      }
      await client.query("COMMIT");
      logger.info("Default users seeded");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};
