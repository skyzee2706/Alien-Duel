/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS challenges (
    id TEXT PRIMARY KEY,
    creator_address TEXT NOT NULL,
    joiner_address TEXT,
    game_type TEXT NOT NULL,
    bet_amount REAL NOT NULL,
    creator_result INTEGER NOT NULL,
    joiner_result INTEGER,
    winner_address TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    alien_id TEXT NOT NULL UNIQUE,
    username TEXT,
    address TEXT UNIQUE,
    balance REAL NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    payout_id TEXT,
    created_at INTEGER NOT NULL
  );
`);

const txColumns = db.prepare('PRAGMA table_info(transactions)').all();
if (!txColumns.some((column) => column.name === 'payout_id')) {
  db.exec('ALTER TABLE transactions ADD COLUMN payout_id TEXT');
}

console.log('Database initialized successfully.');
db.close();
