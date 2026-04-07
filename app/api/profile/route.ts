import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users as usersTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

    const [updatedUser] = await db.update(usersTable)
      .set({ username, updatedAt: new Date() })
      .where(eq(usersTable.id, user.id))
      .returning();

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
