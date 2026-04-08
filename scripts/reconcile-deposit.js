/* eslint-disable @typescript-eslint/no-require-imports */
const Database = require('better-sqlite3');

function resolveDbPath(value) {
  if (!value) return 'sqlite.db';
  if (value.startsWith('file:')) {
    return value.slice('file:'.length);
  }
  return value;
}

const invoice = process.argv[2];

if (!invoice) {
  console.error('Usage: node scripts/reconcile-deposit.js <invoice>');
  process.exit(1);
}

const dbPath = resolveDbPath(process.env.DATABASE_URL);
const sqlite = new Database(dbPath);

const tx = sqlite.transaction((targetInvoice) => {
  const deposit = sqlite.prepare(`
    SELECT id, user_id as userId, amount, status, payout_id as payoutId
    FROM transactions
    WHERE payout_id = ? AND type = 'DEPOSIT'
    LIMIT 1
  `).get(targetInvoice);

  if (!deposit) {
    throw new Error(`Deposit invoice not found: ${targetInvoice}`);
  }

  if (deposit.status === 'COMPLETED') {
    return { invoice: targetInvoice, status: 'already_completed' };
  }

  sqlite.prepare(`
    UPDATE transactions
    SET status = 'COMPLETED'
    WHERE id = ?
  `).run(deposit.id);

  sqlite.prepare(`
    UPDATE users
    SET balance = balance + ?
    WHERE id = ?
  `).run(deposit.amount, deposit.userId);

  return {
    invoice: targetInvoice,
    status: 'completed',
    userId: deposit.userId,
    amount: deposit.amount,
  };
});

try {
  const result = tx(invoice);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
