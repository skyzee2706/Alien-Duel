import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

// Gunakan jalur dari .env jika ada (Sangat penting untuk VPS)
const dbPath = process.env.DATABASE_URL || 'sqlite.db';
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);
