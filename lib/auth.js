
// Authentication utilities for Vercel serverless functions
import bcrypt from 'bcryptjs';
import { db, users } from './db.js';
import { eq } from 'drizzle-orm';

export async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export async function getUserByEmail(email) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user || null;
}

export async function getUserById(id) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || null;
}

export async function createUser(userData) {
  const [newUser] = await db.insert(users).values(userData).returning();
  return newUser;
}
