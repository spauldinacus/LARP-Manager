
// Authentication helpers for Vercel serverless functions
import bcrypt from 'bcrypt';
import { db, users } from './db.js';
import { eq } from 'drizzle-orm';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function getUserByEmail(email) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUserById(id) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

// Session management will need to be adapted for serverless
// For now, we'll use a simple approach but this should be enhanced with JWT or database sessions
export function extractAuthFromRequest(req) {
  // This is a placeholder - we'll need to implement proper session handling
  // Could use JWT tokens, database sessions, or edge-side session storage
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}
