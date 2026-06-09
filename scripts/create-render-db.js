const { renderRequest } = require('./render-client');

async function main() {
  // 1. Fetch Owner ID
  const owners = await renderRequest('GET', '/owners?limit=20');
  if (!owners || owners.length === 0) {
    throw new Error('No owners found!');
  }
  const ownerId = owners[0].owner.id;
  console.log(`Owner ID: ${ownerId}`);

  // 2. Check if a DB already exists
  const dbs = await renderRequest('GET', '/postgresql?limit=50');
  let db = dbs.find(d => d.postgresql.name === 'sport-lounge-n8n-db');

  if (db) {
    console.log('✅ DB already exists:', db.postgresql.id);
    console.log(JSON.stringify(db, null, 2));
  } else {
    console.log('➕ Creating a new free PostgreSQL database...');
    const newDb = await renderRequest('POST', '/postgresql', {
      name: 'sport-lounge-n8n-db',
      ownerId: ownerId,
      plan: 'free',
      databaseName: 'n8ndb',
      databaseUser: 'n8nuser'
    });
    console.log('🎉 DB creation initiated!');
    console.log(JSON.stringify(newDb, null, 2));
  }
}

main().catch(console.error);
