import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions as transactionsTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const history = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.userId, user.id))
      .orderBy(desc(transactionsTable.createdAt));

    return NextResponse.json(history);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
