import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { challenges as challengesTable, transactions as transactionsTable, users as usersTable } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const list = await db.select()
      .from(challengesTable)
      .where(eq(challengesTable.status, 'OPEN'))
      .orderBy(desc(challengesTable.createdAt));
    
    return NextResponse.json(list);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const gType = body.gameType;
    const bAmt = Number(body.betAmount);

    if (!gType || !bAmt) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    if (user.balance < bAmt) return NextResponse.json({ error: 'Low balance' }, { status: 400 });

    // Execute atomic transaction for challenge creation
    const challenge = db.transaction((tx) => {
      tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${bAmt}` })
        .where(eq(usersTable.id, user.id))
        .run();

      tx.insert(transactionsTable).values({
        userId: user.id,
        type: 'WAGER',
        amount: bAmt,
        status: 'COMPLETED',
      }).run();

      const creatorResult = Math.floor(Math.random() * (gType === 'DICE' ? 6 : 10)) + 1;
      const newCh = tx.insert(challengesTable).values({
        creatorAddress: user.alienId,
        gameType: gType,
        betAmount: bAmt,
        creatorResult,
        status: 'OPEN',
      }).returning().get();

      return newCh;
    });

    return NextResponse.json(challenge);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
