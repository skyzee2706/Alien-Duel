import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

/**
 * ⚠️ DEV-ONLY DEPOSIT ROUTE
 * In production, balance is credited via WEBHOOK (/api/webhooks/payment)
 * This route is now only used to simulate/log the start of a deposit.
 */
export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { amount } = await req.json();
    
    // In production, we don't credit balance here!
    // We just return success to indicate the payment intent was captured.
    console.log(`⏳ Payment Intent: ${user.alienId} wants to deposit ${amount}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Payment intent received. Balance will update via webhook confirmation.' 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Process failed' }, { status: 500 });
  }
}
