import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users as usersTable, transactions as transactionsTable } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();
    const withdrawAmount = Number(amount);

    if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
    }

    if (user.balance < withdrawAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const result = db.transaction((tx) => {
      tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${withdrawAmount}` })
        .where(eq(usersTable.id, user.id))
        .run();

      const newTx = tx.insert(transactionsTable).values({
        userId: user.id,
        type: 'WITHDRAW',
        amount: withdrawAmount,
        status: 'PENDING',
      }).returning().get();

      if (!newTx) {
        throw new Error('Failed to create withdrawal transaction');
      }

      tx.update(transactionsTable)
        .set({ status: 'COMPLETED' })
        .where(eq(transactionsTable.id, newTx.id))
        .run();

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 });
  }
}
