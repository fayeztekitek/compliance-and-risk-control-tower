import { query } from "../config/database.js";
import { NotFoundError, ConflictError } from "../core/errors.js";

const TEAM_COLS = ["id", "created_at", "updated_at", "name", "description", "owner_id", "is_active"];

function teamRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    name: r.name, description: r.description,
    ownerId: r.owner_id, isActive: r.is_active,
  };
}

function memberRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at,
    teamId: r.team_id, userId: r.user_id, role: r.role,
  };
}

export const teamService = {
  async create(params: { name: string; description?: string; ownerId?: string }) {
    const existing = await query("SELECT id FROM teams WHERE name = $1", [params.name]);
    if (existing.rows.length) throw new ConflictError(`Team "${params.name}" already exists`);
    const result = await query(
      `INSERT INTO teams (name, description, owner_id) VALUES ($1, $2, $3) RETURNING ${TEAM_COLS.join(", ")}`,
      [params.name, params.description || null, params.ownerId || null]
    );
    return teamRow(result.rows[0]);
  },

  async list() {
    const result = await query(`SELECT ${TEAM_COLS.join(", ")} FROM teams ORDER BY name`);
    return result.rows.map(teamRow);
  },

  async getById(id: string) {
    const result = await query(`SELECT ${TEAM_COLS.join(", ")} FROM teams WHERE id = $1`, [id]);
    if (!result.rows.length) throw new NotFoundError("Team", id);
    return teamRow(result.rows[0]);
  },

  async update(id: string, params: { name?: string; description?: string; isActive?: boolean }) {
    const fields: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (params.name !== undefined) { fields.push(`name = $${idx++}`); vals.push(params.name); }
    if (params.description !== undefined) { fields.push(`description = $${idx++}`); vals.push(params.description); }
    if (params.isActive !== undefined) { fields.push(`is_active = $${idx++}`); vals.push(params.isActive); }
    if (!fields.length) return this.getById(id);
    vals.push(id);
    const result = await query(
      `UPDATE teams SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${TEAM_COLS.join(", ")}`,
      vals
    );
    if (!result.rows.length) throw new NotFoundError("Team", id);
    return teamRow(result.rows[0]);
  },

  async delete(id: string) {
    await this.getById(id);
    await query("DELETE FROM teams WHERE id = $1", [id]);
  },

  async addMember(teamId: string, userId: string, role = "member") {
    await this.getById(teamId);
    const result = await query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, $3)
       ON CONFLICT (team_id, user_id) DO UPDATE SET role = $3 RETURNING *`,
      [teamId, userId, role]
    );
    return memberRow(result.rows[0]);
  },

  async removeMember(teamId: string, userId: string) {
    await query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, userId]);
  },

  async getMembers(teamId: string) {
    await this.getById(teamId);
    const result = await query(
      `SELECT tm.*, u.name as user_name, u.email as user_email, u.role as user_role
       FROM team_members tm JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1 ORDER BY tm.role, u.name`,
      [teamId]
    );
    return result.rows;
  },

  async getUserTeams(userId: string) {
    const result = await query(
      `SELECT t.*, tm.role as membership_role FROM teams t
       JOIN team_members tm ON tm.team_id = t.id
       WHERE tm.user_id = $1 ORDER BY t.name`,
      [userId]
    );
    return result.rows;
  },
};
