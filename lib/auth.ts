import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

/**
 * Centralized Authentication Helper for Alien Network Mini-Apps
 * 
 * In production, this would verify the Web3 signature or JWT from the Alien SDK.
 * For local development, it extracts the alienId from the Bearer token.
 */
export async function verifyAuth(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  // TODO: Implement signature verification using @alien-id/miniapps-server-sdk
  // For now, we assume the token is the alienId (Mocked)
  const alienId = token;

  if (!alienId) return null;

  // Find or Create user in our DB
  let [user] = await db.select().from(users).where(eq(users.alienId, alienId)).limit(1);
  
  if (!user) {
    const [newUser] = await db.insert(users).values({
      alienId: alienId,
      username: alienId, // Default username
      balance: 0,
    }).returning();
    user = newUser;
  }

  return user;
}
