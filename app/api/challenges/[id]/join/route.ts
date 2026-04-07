import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { challenges as challengesTable, transactions as transactionsTable, users as usersTable } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // 1. Fetch existing challenge
    const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, id)).limit(1);

    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    if (challenge.status !== 'OPEN') return NextResponse.json({ error: 'Challenge already closed' }, { status: 400 });
    if (challenge.creatorAddress === user.alienId) {
      return NextResponse.json({ error: 'Cannot join your own challenge' }, { status: 400 });
    }

    if (user.balance < challenge.betAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 2. Game Resolution Logic
    const max = challenge.gameType === 'DICE' ? 6 : 10;
    let joinerResult = 0;
    let winnerAddress = '';

    // Generate unique joiner result (draws not allowed)
    let resolved = false;
    while (!resolved) {
      joinerResult = Math.floor(Math.random() * max) + 1;
      if (joinerResult !== challenge.creatorResult) {
        resolved = true;
      }
    }

    if (joinerResult > challenge.creatorResult) {
      winnerAddress = user.alienId;
    } else {
      winnerAddress = challenge.creatorAddress;
    }

    // 3. Atomic Transaction: Deduct joiner, credit winner, update challenge
    const totalPrize = Number(challenge.betAmount) * 1.8; // 90% of total pool (2x bet)

    await db.transaction(async (tx) => {
      // A. Deduct joiner balance
      await tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${challenge.betAmount}` })
        .where(eq(usersTable.id, user.id));

      await tx.insert(transactionsTable).values({
        userId: user.id,
        type: 'WAGER',
        amount: challenge.betAmount,
        status: 'COMPLETED',
      });

      // B. Update challenge status
      await tx.update(challengesTable)
        .set({
          joinerAddress: user.alienId,
          joinerResult,
          winnerAddress,
          status: 'FINISHED',
          updatedAt: new Date(),
        })
        .where(eq(challengesTable.id, id));

      // C. Credit winner balance
      const [winner] = await tx.select().from(usersTable).where(eq(usersTable.alienId, winnerAddress)).limit(1);
      if (winner) {
        await tx.update(usersTable)
          .set({ balance: sql`${usersTable.balance} + ${totalPrize}` })
          .where(eq(usersTable.id, winner.id));

        await tx.insert(transactionsTable).values({
          userId: winner.id,
          type: 'WIN',
          amount: totalPrize,
          status: 'COMPLETED',
        });
      }
    });

    return NextResponse.json({ success: true, winner: winnerAddress });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Join failed' }, { status: 500 });
  }
}
