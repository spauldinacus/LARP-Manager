// Login endpoint for Vercel
import { getUserByEmail, comparePassword } from '../../lib/auth.js';
import { setSessionData } from '../../lib/session.js';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create session data (only non-sensitive info)
    const sessionData = {
      userId: user.id,
      isAdmin: user.isAdmin,
      userRole: user.roleId || 'user',
    };

    // Set encrypted session cookie
    await setSessionData(res, sessionData);

    return res.status(200).json({ 
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
    console.error("Login error:", error);
    return res.status(400).json({ 
      message: error instanceof Error ? error.message : "Login failed" 
    });
  }
}