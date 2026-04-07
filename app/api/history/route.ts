import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { challenges } from '@/lib/db/schema';
import { or, eq, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const list = await db.select()
      .from(challenges)
      .where(or(
        eq(challenges.creatorAddress, user.alienId),
        eq(challenges.joinerAddress, user.alienId)
      ))
      .orderBy(desc(challenges.createdAt));
    
    return NextResponse.json(list);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
