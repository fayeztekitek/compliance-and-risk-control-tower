const { readFileSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ host: 'localhost', port: 5432, database: 'compliance_tower', user: 'postgres', password: 'postgres' });
  const dir = join(__dirname, 'migrations');

  const f = '009_seed_data.sql';
  const sql = readFileSync(join(dir, f), 'utf8');

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('OK:', f);
  } catch (e) {
    console.error('FAIL:', f, e.message.slice(0, 500));
  } finally {
    client.release();
  }

  try {
    const users = await pool.query('SELECT email, role FROM users ORDER BY role');
    console.log('Seed users:', users.rows.map(r => `${r.email} (${r.role})`).join(', '));
  } catch (e) {
    console.log('Users query:', e.message);
  }

  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
