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
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("🚨 Auth Error: Missing or invalid Authorization header");
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    // In production, token is usually a hex ID or a JWT.
    // If it's too short, it might be an error from the frontend.
    if (!token || token.length < 5) {
      console.error(`🚨 Auth Error: Token is unusually short (${token.length})`);
      return null;
    }

    const alienId = token; // Temporary: In real prod, this might need JWT decoding
    console.log(`👤 Auth Success: Verified user with alienId ${alienId.substring(0, 8)}...`);

    // Find or Create user in our DB
    let [user] = await db.select().from(users).where(eq(users.alienId, alienId)).limit(1);
    
    if (!user) {
      console.log(`✨ New User: Creating record for ${alienId.substring(0, 8)}...`);
      const [newUser] = await db.insert(users).values({
        alienId: alienId,
        username: `Alien_${alienId.substring(0, 4)}`, // Better default name
        balance: 0,
      }).returning();
      user = newUser;
    }

    return user;
  } catch (error) {
    console.error("❌ Auth System Failure:", error);
    return null;
  }
}
