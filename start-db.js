const { createRequire } = require('module');
const path = require('path');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

// Get the pg binary path from the installed package
const pgBinDir = path.join(__dirname, 'node_modules', '@embedded-postgres', 'windows-x64', 'bin');
const pgDataDir = path.join(__dirname, 'pg-data');

const port = 51214;

// Check if data dir exists, if not initialize
if (!fs.existsSync(pgDataDir)) {
  console.log('Initializing PostgreSQL data directory...');
  const initdb = path.join(pgBinDir, 'initdb.exe');
  execSync(`"${initdb}" -D "${pgDataDir}" -U postgres -E UTF8 --no-locale`, { stdio: 'inherit' });
  
  // Configure pg_hba.conf for trust auth
  const hbaPath = path.join(pgDataDir, 'pg_hba.conf');
  fs.writeFileSync(hbaPath, `
local all all trust
host all all 127.0.0.1/32 trust
host all all ::1/128 trust
`);
}

// Start PostgreSQL
console.log(`Starting PostgreSQL on port ${port}...`);
const pg_ctl = path.join(pgBinDir, 'pg_ctl.exe');
const child = spawn(pg_ctl, ['start', '-D', pgDataDir, '-l', path.join(pgDataDir, 'logfile'), '-o', `-p ${port}`], {
  stdio: 'inherit'
});

child.on('close', (code) => {
  if (code === 0) {
    console.log(`PostgreSQL started on port ${port}`);
  } else {
    console.error(`pg_ctl exited with code ${code}`);
  }
});
