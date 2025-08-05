
// Me endpoint for Vercel
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { unsealData } from 'iron-session';
import { users } from '../../shared/schema.js';

// Database setup (inline to avoid import issues)
const sql = neon(process.env.DATABASE_URL, {
  fetchConnectionCache: true,
});
const db = drizzle(sql, { schema: { users } });

// Session options (inline to avoid import issues)
const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_change_in_production',
  cookieName: 'thrune_session',
};

// Helper to parse cookies from request header
function parseCookies(cookieHeader) {
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get session from cookie
    const cookie = req.headers.cookie;
    if (!cookie) {
      return res.status(401).json({ message: 'No session found' });
    }

    const cookies = parseCookies(cookie);
    const sessionCookie = cookies[sessionOptions.cookieName];

    if (!sessionCookie) {
      return res.status(401).json({ message: 'No session found' });
    }

    // Decrypt session
    const sessionData = await unsealData(sessionCookie, {
      password: sessionOptions.password,
    });

    if (!sessionData || !sessionData.userId) {
      return res.status(401).json({ message: 'Invalid session' });
    }

    // Get current user data
    const [user] = await db.select().from(users).where(eq(users.id, sessionData.userId));
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Me endpoint error:', error);
    return res.status(500).json({ 
      message: 'Failed to get user data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
