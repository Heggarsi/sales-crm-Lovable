'use strict';

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ─── DB Configuration ────────────────────────────────────────────────────────
const dbConfig = {
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || '3306',
  user:     process.env.DB_USER     || 'salescrmuser',
  password: process.env.DB_PASSWORD || 'StrongPassword123!',
  database: process.env.DB_NAME     || 'salescrmv1',
};

// ─── Output File ─────────────────────────────────────────────────────────────
const OUTPUT_FILE = path.resolve(__dirname, 'schema.sql');

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Safely escape a password so it can be embedded in the shell command.
 * On Windows the command is run inside cmd.exe; on POSIX it runs via /bin/sh.
 * We wrap the password in double-quotes and escape any embedded double-quotes.
 */
function escapePassword(password) {
  // Replace every " with \" so the shell doesn't terminate the argument early
  return password.replace(/"/g, '\\"');
}

/**
 * Build the mysqldump command string.
 * --no-data  → schema only (no INSERT rows)
 * --routines → include stored procedures / functions
 * --triggers → include triggers
 * --single-transaction → consistent snapshot without locking (InnoDB)
 */
function buildCommand(cfg, outFile) {
  const escapedPwd = escapePassword(cfg.password);

  // NOTE: -p with no space between flag and password is intentional —
  //       it prevents the password from appearing as a visible argument.
  const dump =
    `mysqldump` +
    ` -h ${cfg.host}` +
    ` -P ${cfg.port}` +
    ` -u ${cfg.user}` +
    ` -p"${escapedPwd}"` +
    ` --no-data` +
    ` --routines` +
    ` --triggers` +
    ` --single-transaction` +
    ` --skip-lock-tables` +
    ` ${cfg.database}`;

  // Redirect output to file using the shell (works on both Linux and Windows)
  return `${dump} > "${outFile}"`;
}

// ─── Main Export Function ─────────────────────────────────────────────────────
function exportSchema() {
  console.log('🔄  Starting schema export...');
  console.log(`    Host     : ${dbConfig.host}:${dbConfig.port}`);
  console.log(`    Database : ${dbConfig.database}`);
  console.log(`    Output   : ${OUTPUT_FILE}`);
  console.log('');

  // Validate required config values
  const required = ['host', 'user', 'password', 'database'];
  for (const key of required) {
    if (!dbConfig[key]) {
      console.error(`❌  Missing required DB config value: "${key}"`);
      process.exit(1);
    }
  }

  const command = buildCommand(dbConfig, OUTPUT_FILE);

  // exec options — use shell so the > redirect works on both platforms
  const execOptions = {
    shell: true,           // let the OS choose the default shell
    maxBuffer: 50 * 1024 * 1024, // 50 MB buffer (handles large schemas)
    windowsHide: true,     // hide console window on Windows
  };

  exec(command, execOptions, (error, stdout, stderr) => {
    if (error) {
      console.error('❌  mysqldump failed.');
      console.error('    Error code :', error.code);
      console.error('    Message    :', error.message);
      if (stderr) {
        // Filter out the "Using a password on the command line..." warning
        const filtered = stderr
          .split('\n')
          .filter(line => !line.includes('Using a password on the command line'))
          .join('\n')
          .trim();
        if (filtered) console.error('    stderr     :', filtered);
      }
      process.exit(1);
    }

    // Verify the output file was actually written and is non-empty
    let stat;
    try {
      stat = fs.statSync(OUTPUT_FILE);
    } catch (statErr) {
      console.error('❌  Output file was not created:', statErr.message);
      process.exit(1);
    }

    if (stat.size === 0) {
      console.error('❌  Output file is empty. Check DB credentials and database name.');
      process.exit(1);
    }

    const sizeKB = (stat.size / 1024).toFixed(2);
    console.log(`✅  Schema exported successfully!`);
    console.log(`    File : ${OUTPUT_FILE}`);
    console.log(`    Size : ${sizeKB} KB`);

    // Optionally print non-error stderr lines (e.g. mysqldump informational messages)
    if (stderr) {
      const info = stderr
        .split('\n')
        .filter(
          line =>
            line.trim() &&
            !line.includes('Using a password on the command line')
        )
        .join('\n')
        .trim();
      if (info) console.log('\n⚠️   mysqldump info:\n', info);
    }
  });
}

// ─── Entry Point ─────────────────────────────────────────────────────────────
exportSchema();
