import { NextResponse } from 'next/server';
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

    return NextResponse.json(
      {
        error:
          'Wallet withdrawal is not configured yet. Internal balance was not changed.',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 });
  }
}
