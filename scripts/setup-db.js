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
    address TEXT UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

console.log('Database initialized successfully.');
db.close();
