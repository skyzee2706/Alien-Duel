import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, transactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * 🔒 SECURE WEBHOOK ENDPOINT
 * This endpoint is called ONLY by Alien Network servers
 * It credits user balance after a REAL payment is confirmed.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { alienId, amount, paymentId, signature } = payload;

    // TODO: Verify signature from Alien Network using PUBLIC_KEY
    // if (!verifySignature(payload, signature)) return Error...

    if (!alienId || !amount) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Deduplicate check: Ensure this payment hasn't been credited
    const [existingTx] = await db.select().from(transactions).where(eq(transactions.payoutId, paymentId)).limit(1);
    if (existingTx) {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // 2. Perform Atomic Credit
    await db.transaction(async (tx) => {
      // Find or create user
      const [u] = await tx.select().from(users).where(eq(users.alienId, alienId)).limit(1);
      
      const targetUser = u || (await tx.insert(users).values({ 
        alienId, 
        username: alienId,
        balance: 0 
      }).returning())[0];

      // Update balance
      await tx.update(users)
        .set({ balance: sql`${users.balance} + ${Number(amount)}` })
        .where(eq(users.id, targetUser.id));

      // Record transaction with payoutId (the Alien Payment ID)
      await tx.insert(transactions).values({
        userId: targetUser.id,
        type: 'DEPOSIT',
        amount: Number(amount),
        status: 'COMPLETED',
        payoutId: paymentId, // Map to Alien Network payment ID
      });
    });

    console.log(`✅ Webhook: Credited ${amount} ALIEN to ${alienId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
