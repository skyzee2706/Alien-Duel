import { NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import nacl from 'tweetnacl';
import { db } from '@/lib/db';
import { transactions, users } from '@/lib/db/schema';

type PaymentWebhookPayload = {
  invoice?: string;
  status?: string;
  txHash?: string;
};

function verifyWebhookSignature(
  body: string,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  const message = new TextEncoder().encode(body);
  const signature = Buffer.from(signatureHex, 'hex');
  const publicKey = Buffer.from(publicKeyHex, 'hex');
  return nacl.sign.detached.verify(message, signature, publicKey);
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signatureHex = req.headers.get('x-webhook-signature') ?? '';

  if (!signatureHex) {
    return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
  }

  const webhookPublicKey = process.env.WEBHOOK_PUBLIC_KEY;
  if (!webhookPublicKey) {
    return NextResponse.json({ error: 'Webhook key is not configured' }, { status: 500 });
  }

  try {
    const isValid = verifyWebhookSignature(rawBody, signatureHex, webhookPublicKey);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PaymentWebhookPayload;
    const invoice = payload.invoice;
    const status = payload.status;

    if (!invoice || !status) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      const [depositTx] = await tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.payoutId, invoice),
            eq(transactions.type, 'DEPOSIT')
          )
        )
        .limit(1);

      if (!depositTx) {
        return;
      }

      if (status === 'finalized') {
        if (depositTx.status === 'COMPLETED') {
          return;
        }

        await tx
          .update(transactions)
          .set({ status: 'COMPLETED' })
          .where(eq(transactions.id, depositTx.id));

        await tx
          .update(users)
          .set({ balance: sql`${users.balance} + ${depositTx.amount}` })
          .where(eq(users.id, depositTx.userId));
        return;
      }

      if (status === 'failed' && depositTx.status !== 'COMPLETED') {
        await tx
          .update(transactions)
          .set({ status: 'FAILED' })
          .where(eq(transactions.id, depositTx.id));
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
