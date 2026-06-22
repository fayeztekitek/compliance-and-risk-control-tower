const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ host: 'localhost', port: 5432, database: 'compliance_tower', user: 'postgres', password: 'postgres' });
  const dir = join(__dirname, 'migrations');

  const isDown = process.argv.includes('--down');
  const files = readdirSync(dir)
    .filter(f => {
      if (isDown) return f.endsWith('_down.sql');
      return f.match(/^\d+_.+\.sql$/) && !f.includes('_down');
    })
    .sort();

  console.log('Files to run:', files.join(', '));

  const client = await pool.connect();
  try {
    for (const f of files) {
      const sql = readFileSync(join(dir, f), 'utf8');
      try {
        await client.query(sql);
        console.log('OK:', f);
      } catch (e) {
        console.error('FAIL:', f, e.message.slice(0, 300));
      }
    }
  } finally {
    client.release();
  }

  const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('\nTables (' + result.rows.length + '):', result.rows.map(r => r.table_name).join(', '));

  try {
    const users = await pool.query('SELECT email, role FROM users ORDER BY role');
    console.log('Seed users:', users.rows.map(r => `${r.email} (${r.role})`).join(', '));
  } catch (e) {
    console.log('Users query:', e.message);
  }

  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
