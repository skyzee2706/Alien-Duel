import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users as usersTable, transactions as transactionsTable } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

/**
 * 💸 WITHDRAWAL API
 * Credits user balance internal, then triggers Alien Payout API
 */
export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount < 1) {
      return NextResponse.json({ error: 'Minimum withdrawal is 1 ALIEN' }, { status: 400 });
    }

    if (user.balance < withdrawAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 1. Process local deduction
    const result = await db.transaction(async (tx) => {
      await tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${withdrawAmount}` })
        .where(eq(usersTable.id, user.id));

      const [newTx] = await tx.insert(transactionsTable).values({
        userId: user.id,
        type: 'WITHDRAW',
        amount: withdrawAmount,
        status: 'PENDING', // Pending until API success
      }).returning();

      // 2. 🔥 TODO: Call Alien Network Payout API
      // const payout = await alienPayoutSystem.send({
      //   to: user.alienId,
      //   amount: withdrawAmount,
      //   apiKey: process.env.ALIEN_API_KEY
      // });
      
      // For now, we mock success
      await tx.update(transactionsTable)
        .set({ status: 'COMPLETED' })
        .where(eq(transactionsTable.id, newTx.id));

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 });
  }
}
