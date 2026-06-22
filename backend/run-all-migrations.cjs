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

  const counts = await Promise.all([
    pool.query('SELECT COUNT(*) as c FROM veg_requests'),
    pool.query('SELECT COUNT(*) as c FROM opportunities'),
    pool.query('SELECT COUNT(*) as c FROM contracts'),
    pool.query('SELECT COUNT(*) as c FROM vulnerabilities'),
    pool.query('SELECT COUNT(*) as c FROM waivers'),
    pool.query('SELECT COUNT(*) as c FROM risk_acceptances'),
    pool.query('SELECT COUNT(*) as c FROM nexus_products'),
    pool.query('SELECT COUNT(*) as c FROM nexus_vulnerabilities'),
    pool.query('SELECT COUNT(*) as c FROM roadmaps'),
    pool.query('SELECT COUNT(*) as c FROM projects'),
  ]);
  console.log('\nRecord counts:');
  console.log('  veg_requests:', counts[0].rows[0].c);
  console.log('  opportunities:', counts[1].rows[0].c);
  console.log('  contracts:', counts[2].rows[0].c);
  console.log('  vulnerabilities:', counts[3].rows[0].c);
  console.log('  waivers:', counts[4].rows[0].c);
  console.log('  risk_acceptances:', counts[5].rows[0].c);
  console.log('  nexus_products:', counts[6].rows[0].c);
  console.log('  nexus_vulnerabilities:', counts[7].rows[0].c);
  console.log('  roadmaps:', counts[8].rows[0].c);
  console.log('  projects:', counts[9].rows[0].c);

  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
