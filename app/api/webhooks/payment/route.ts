import { NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import nacl from 'tweetnacl';
import { db } from '@/lib/db';
import { transactions, users } from '@/lib/db/schema';

type PaymentWebhookPayload = {
  invoice?: string;
  status?: string;
  txHash?: string;
  paymentId?: string;
  alienId?: string;
  amount?: number | string;
  appId?: string;
};

function isHex(input: string, length: number): boolean {
  return new RegExp(`^[0-9a-fA-F]{${length}}$`).test(input);
}

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
    if (!isHex(signatureHex, 128) || !isHex(webhookPublicKey, 64)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const isValid = verifyWebhookSignature(rawBody, signatureHex, webhookPublicKey);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as PaymentWebhookPayload;
    console.log('Payment webhook received with keys:', Object.keys(payload));

    const invoice = payload.invoice;
    const status = payload.status;
    const legacyPaymentId = payload.paymentId;
    const legacyAlienId = payload.alienId;

    if (
      !invoice &&
      !(legacyPaymentId && legacyAlienId)
    ) {
      return NextResponse.json({ success: true, ignored: 'Unsupported webhook payload' });
    }

    db.transaction((tx) => {
      if (invoice && status) {
        const depositTx = tx
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.payoutId, invoice),
              eq(transactions.type, 'DEPOSIT')
            )
          )
          .get();

        if (!depositTx) {
          return;
        }

        if (status === 'finalized') {
          if (depositTx.status === 'COMPLETED') {
            return;
          }

          tx
            .update(transactions)
            .set({ status: 'COMPLETED' })
            .where(eq(transactions.id, depositTx.id));

          tx
            .update(users)
            .set({ balance: sql`${users.balance} + ${depositTx.amount}` })
            .where(eq(users.id, depositTx.userId));
          return;
        }

        if (status === 'failed' && depositTx.status !== 'COMPLETED') {
          tx
            .update(transactions)
            .set({ status: 'FAILED' })
            .where(eq(transactions.id, depositTx.id));
        }
        return;
      }

      if (!legacyAlienId || !legacyPaymentId) {
        return;
      }

      const targetUser = tx
        .select()
        .from(users)
        .where(eq(users.alienId, legacyAlienId))
        .get();

      if (!targetUser) {
        return;
      }

      const existingPaidTx = tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'DEPOSIT'),
            eq(transactions.payoutId, legacyPaymentId)
          )
        )
        .get();

      if (existingPaidTx?.status === 'COMPLETED') {
        return;
      }

      const pendingDeposit = tx
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, targetUser.id),
            eq(transactions.type, 'DEPOSIT'),
            eq(transactions.status, 'PENDING')
          )
        )
        .orderBy(desc(transactions.createdAt))
        .get();

      if (!pendingDeposit) {
        return;
      }

      tx
        .update(transactions)
        .set({ status: 'COMPLETED', payoutId: legacyPaymentId })
        .where(eq(transactions.id, pendingDeposit.id));

      tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${pendingDeposit.amount}` })
        .where(eq(users.id, pendingDeposit.userId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
