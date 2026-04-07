import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactions } from '@/lib/db/schema';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
    }

    const invoice = `dep_${randomUUID()}`;

    await db.insert(transactions).values({
      userId: user.id,
      type: 'DEPOSIT',
      amount,
      status: 'PENDING',
      payoutId: invoice,
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Failed to create deposit intent:', error);
    return NextResponse.json({ error: 'Failed to create deposit intent' }, { status: 500 });
  }
}
