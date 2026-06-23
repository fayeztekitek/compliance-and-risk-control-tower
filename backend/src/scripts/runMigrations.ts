import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const pool = new pg.Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    database: process.env.DB_NAME || "compliance_tower",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
  });

  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS pgmigrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      run_on TIMESTAMP NOT NULL DEFAULT NOW()
    )`);

    const migrationsDir = path.resolve(__dirname, "..", "..", "migrations");
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql") && !f.includes("_down."))
      .sort();

    const { rows: done } = await client.query("SELECT name FROM pgmigrations");
    const doneNames = new Set(done.map((r: any) => r.name));

    for (const file of files) {
      if (doneNames.has(file)) {
        console.log(`SKIP ${file} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      console.log(`RUN ${file}...`);
      await client.query(sql);
      await client.query("INSERT INTO pgmigrations (name, run_on) VALUES ($1, NOW())", [file]);
      console.log(`OK ${file}`);
    }
    console.log("All migrations applied");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
