import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

function resolveDbPath(value: string | undefined): string {
  if (!value) return 'sqlite.db';

  // Handle Prisma-like `file:./sqlite.db` URLs.
  if (value.startsWith('file:')) {
    return value.slice('file:'.length);
  }

  return value;
}

const dbPath = resolveDbPath(process.env.DATABASE_URL);
const sqlite = new Database(dbPath);

// Backward-compatible migration for older local databases.
const transactionColumns = sqlite
  .prepare('PRAGMA table_info(transactions)')
  .all() as Array<{ name: string }>;

if (
  transactionColumns.length > 0 &&
  !transactionColumns.some((column) => column.name === 'payout_id')
) {
  sqlite.exec('ALTER TABLE transactions ADD COLUMN payout_id TEXT');
}

export const db = drizzle(sqlite);
