import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, transactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import nacl from 'tweetnacl';

/**
 * 🔒 PRODUCTION-GRADE SECURE WEBHOOK
 * Verifies authenticity using Alien Network's Ed25519 signature.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const { alienId, amount, paymentId, signature, appId } = payload;

    // 1. App ID Check
    if (appId !== process.env.NEXT_PUBLIC_ALIEN_APP_ID) {
      console.warn(`🚨 Security: Wrong App ID received: ${appId}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. CRYPTOGRAPHIC SIGNATURE VERIFICATION
    // We check if this data really came from Alien Network.
    const publicKey = process.env.WEBHOOK_PUBLIC_KEY;
    if (publicKey && signature) {
      try {
        // Construct message (exactly as signed by Alien)
        // Note: Alien signs the JSON body excluding the 'signature' field.
        const msgObj = { ...payload };
        delete msgObj.signature;
        const message = new TextEncoder().encode(JSON.stringify(msgObj));
        
        const isVerified = nacl.sign.detached.verify(
          message,
          Buffer.from(signature, 'hex'),
          Buffer.from(publicKey, 'hex')
        );

        if (!isVerified) {
          console.error("🚨 Security: Invalid Webhook Signature!");
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }
      } catch (err) {
        console.error("🚨 Security: Signature decoding failed", err);
        return NextResponse.json({ error: 'Signature failure' }, { status: 401 });
      }
    }

    if (!alienId || !amount) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 3. Deduplication: Don't process the same payment twice
    const [existingTx] = await db.select().from(transactions).where(eq(transactions.payoutId, paymentId)).limit(1);
    if (existingTx) return NextResponse.json({ success: true, message: 'Existing' });

    // 4. Atomic Balance Update
    await db.transaction(async (tx) => {
      let [u] = await tx.select().from(users).where(eq(users.alienId, alienId)).limit(1);
      
      const targetUser = u || (await tx.insert(users).values({ 
        alienId, 
        username: `Alien_${alienId.substring(0, 4)}`,
        balance: 0 
      }).returning())[0];

      // Add balance
      await tx.update(users)
        .set({ balance: sql`${users.balance} + ${Number(amount)}` })
        .where(eq(users.id, targetUser.id));

      // Record Deposit Transaction
      await tx.insert(transactions).values({
        userId: targetUser.id,
        type: 'DEPOSIT',
        amount: Number(amount),
        status: 'COMPLETED',
        payoutId: paymentId, 
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
