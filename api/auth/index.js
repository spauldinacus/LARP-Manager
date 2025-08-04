
// Combined auth endpoints for Vercel
import { getUserByEmail, comparePassword, hashPassword, getUserById } from '../lib/auth.js';
import { setSessionData, getSessionData, clearSession, requireAuth } from '../lib/session.js';
import { db, users } from '../lib/db.js';
import { z } from 'zod';

export default async function handler(req, res) {
  const { method } = req;
  const path = req.url?.split('?')[0] || '';
  
  try {
    // Login endpoint
    if (method === 'POST' && path === '/api/auth/login') {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1)
      });

      const { email, password } = loginSchema.parse(req.body);
      const user = await getUserByEmail(email);

      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      await setSessionData(res, {
        userId: user.id,
        isAdmin: user.isAdmin,
        userRole: user.roleId
      });

      return res.status(200).json({
        user: {
          id: user.id,
          playerName: user.playerName,
          email: user.email,
          isAdmin: user.isAdmin,
          roleId: user.roleId,
          candles: user.candles || 0,
          playerNumber: user.playerNumber,
          chapterId: user.chapterId,
          title: user.title
        }
      });
    }

    // Register endpoint
    if (method === 'POST' && path === '/api/auth/register') {
      const registerSchema = z.object({
        playerName: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6)
      });

      const { playerName, email, password } = registerSchema.parse(req.body);
      
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await hashPassword(password);
      const [newUser] = await db.insert(users)
        .values({
          playerName,
          email,
          password: hashedPassword,
          isAdmin: false,
          candles: 0
        })
        .returning();

      await setSessionData(res, {
        userId: newUser.id,
        isAdmin: newUser.isAdmin,
        userRole: newUser.roleId
      });

      return res.status(201).json({
        user: {
          id: newUser.id,
          playerName: newUser.playerName,
          email: newUser.email,
          isAdmin: newUser.isAdmin,
          roleId: newUser.roleId,
          candles: newUser.candles || 0,
          playerNumber: newUser.playerNumber,
          chapterId: newUser.chapterId,
          title: newUser.title
        }
      });
    }

    // Current user endpoint
    if (method === 'GET' && path === '/api/auth/me') {
      const session = await getSessionData(req);
      if (!session) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await getUserById(session.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      return res.status(200).json({
        user: {
          id: user.id,
          playerName: user.playerName,
          email: user.email,
          isAdmin: user.isAdmin,
          roleId: user.roleId,
          candles: user.candles || 0,
          playerNumber: user.playerNumber,
          chapterId: user.chapterId,
          title: user.title
        }
      });
    }

    // Logout endpoint
    if (method === 'POST' && path === '/api/auth/logout') {
      clearSession(res);
      return res.status(200).json({ message: 'Logged out successfully' });
    }

    return res.status(404).json({ message: 'Auth endpoint not found' });
    
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
