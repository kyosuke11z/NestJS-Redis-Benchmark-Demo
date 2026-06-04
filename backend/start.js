const { execSync } = require('child_process');
const { Client } = require('pg');

async function waitForPostgres() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  console.log('Orchestrator: Parsing DATABASE_URL...');
  
  // Basic parsing of postgresql://user:pass@host:port/db
  const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error('DATABASE_URL format invalid. Defaulting to standard wait...');
    // Fallback: wait a static 10s
    await new Promise((r) => setTimeout(r, 10000));
    return;
  }

  const [_, user, password, host, port, dbNameClean] = match;
  const database = dbNameClean.split('?')[0];

  console.log(`Orchestrator: Waiting for PostgreSQL at ${host}:${port}...`);

  const client = new Client({
    host,
    port: parseInt(port, 10),
    user,
    password,
    database,
    connectionTimeoutMillis: 2000,
  });

  let retries = 30;
  while (retries > 0) {
    try {
      await client.connect();
      console.log('Orchestrator: PostgreSQL is UP and reachable!');
      await client.end();
      break;
    } catch (err) {
      retries--;
      console.log(`Orchestrator: PostgreSQL connection failed. Retrying in 2 seconds... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (retries === 0) {
    console.error('Orchestrator: PostgreSQL could not be reached. Exiting.');
    process.exit(1);
  }
}

async function run() {
  await waitForPostgres();

  try {
    console.log('Orchestrator: Synchronizing Database schema via Prisma...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    console.log('Orchestrator: Running database seeds...');
    execSync('npx prisma db seed', { stdio: 'inherit' });

    console.log('Orchestrator: Launching backend in production mode...');
    execSync('npm run start:prod', { stdio: 'inherit' });
  } catch (error) {
    console.error('Orchestrator: Failure executing child command.', error);
    process.exit(1);
  }
}

run();
