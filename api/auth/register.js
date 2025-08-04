// Registration endpoint for Vercel
import { db, users } from '../lib/db.js';
import { getUserByEmail, hashPassword } from '../lib/auth.js';
import { setSessionData } from '../lib/session.js';
import { z } from 'zod';

const registerSchema = z.object({
  playerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  chapterId: z.string().optional(),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { playerName, email, password, chapterId } = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const [user] = await db.insert(users).values({
      playerName,
      email,
      password: hashedPassword,
      chapterId: chapterId || null,
      isAdmin: false,
    }).returning();

    // Create session data for new user
    const sessionData = {
      userId: user.id,
      isAdmin: user.isAdmin,
      userRole: user.roleId || 'user',
    };

    // Set encrypted session cookie
    await setSessionData(res, sessionData);

    return res.status(201).json({ 
      user: { 
        id: user.id, 
        playerName: user.playerName, 
        email: user.email, 
        isAdmin: user.isAdmin, 
        roleId: user.roleId, 
        candles: user.candles || 0, 
        playerNumber: user.playerNumber, 
        chapterId: user.chapterId 
      } 
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(400).json({ 
      message: error instanceof Error ? error.message : "Registration failed" 
    });
  }
}