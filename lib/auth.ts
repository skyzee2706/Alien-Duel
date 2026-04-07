import { createAuthClient, JwtErrors } from '@alien-id/miniapps-auth-client';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users } from './db/schema';

const audience =
  process.env.ALIEN_PROVIDER_ADDRESS || process.env.NEXT_PUBLIC_ALIEN_APP_ID;

const authClient = audience ? createAuthClient({ audience }) : null;

function extractBearerToken(header: string | null): string | null {
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7).trim();
}

function decodeSubWithoutVerification(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    ) as { sub?: unknown };
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

async function resolveAlienId(token: string): Promise<string> {
  if (authClient) {
    const tokenInfo = await authClient.verifyToken(token);
    return tokenInfo.sub;
  }

  if (process.env.NODE_ENV !== 'production') {
    const decodedSub = decodeSubWithoutVerification(token);
    if (decodedSub) return decodedSub;
    return token;
  }

  throw new Error(
    'Missing auth audience. Set ALIEN_PROVIDER_ADDRESS or NEXT_PUBLIC_ALIEN_APP_ID.'
  );
}

export async function verifyAuth(req: Request) {
  const token = extractBearerToken(req.headers.get('Authorization'));
  if (!token) {
    return null;
  }

  try {
    const alienId = await resolveAlienId(token);
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.alienId, alienId))
      .limit(1);

    if (!user) {
      const [created] = await db
        .insert(users)
        .values({
          alienId,
          username: `Alien_${alienId.slice(0, 6)}`,
          balance: 0,
        })
        .returning();
      user = created;
    }

    return user;
  } catch (error) {
    if (error instanceof JwtErrors.JWTExpired) {
      console.warn('Auth token expired');
      return null;
    }
    if (error instanceof JwtErrors.JOSEError) {
      console.warn('Invalid auth token');
      return null;
    }
    console.error('Auth verification failed:', error);
    return null;
  }
}
