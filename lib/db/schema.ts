import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { v4 as uuidv4 } from 'uuid';

export const challenges = sqliteTable('challenges', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  creatorAddress: text('creator_address').notNull(),
  joinerAddress: text('joiner_address'),
  gameType: text('game_type').notNull(), // "DICE" or "LUCKY_NUMBER"
  betAmount: real('bet_amount').notNull(),
  creatorResult: integer('creator_result').notNull(),
  joinerResult: integer('joiner_result'),
  winnerAddress: text('winner_address'),
  status: text('status').notNull().default('OPEN'), // "OPEN", "FINISHED"
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  alienId: text('alien_id').notNull().unique(),
  username: text('username'),
  address: text('address').unique(),
  balance: real('balance').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  userId: text('user_id').notNull(),
  type: text('type').notNull(), // "DEPOSIT", "WITHDRAW", "WAGER", "WIN"
  amount: real('amount').notNull(),
  status: text('status').notNull().default('COMPLETED'), // "PENDING", "COMPLETED", "FAILED"
  payoutId: text('payout_id'), // To store Alien Network payment/payout IDs
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
