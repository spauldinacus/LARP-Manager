// Session management for Vercel serverless functions using iron-session
import { sealData, unsealData } from 'iron-session';

const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_change_in_production',
  cookieName: 'thrune_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
    path: '/',
  },
};

export async function getSessionData(req) {
  const cookie = req.headers.cookie;
  if (!cookie) return null;
  
  const cookies = parseCookies(cookie);
  const sessionCookie = cookies[sessionOptions.cookieName];
  
  if (!sessionCookie) return null;
  
  try {
    const sessionData = await unsealData(sessionCookie, {
      password: sessionOptions.password,
    });
    return sessionData;
  } catch (error) {
    console.error('Session decryption error:', error);
    return null;
  }
}

export async function setSessionData(res, data) {
  const sealed = await sealData(data, {
    password: sessionOptions.password,
  });
  
  const cookieValue = `${sessionOptions.cookieName}=${sealed}; HttpOnly; Path=/; Max-Age=${sessionOptions.cookieOptions.maxAge}; SameSite=${sessionOptions.cookieOptions.sameSite}${sessionOptions.cookieOptions.secure ? '; Secure' : ''}`;
  
  res.setHeader('Set-Cookie', cookieValue);
}

export async function clearSession(res) {
  const cookieValue = `${sessionOptions.cookieName}=; HttpOnly; Path=/; Max-Age=0; SameSite=${sessionOptions.cookieOptions.sameSite}${sessionOptions.cookieOptions.secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieValue);
}

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

// Middleware function to check authentication
export async function requireAuth(req, res) {
  const session = await getSessionData(req);
  
  if (!session || !session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  return session;
}

// Middleware function to check admin access
export async function requireAdmin(req, res) {
  const session = await getSessionData(req);
  
  if (!session || !session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (!session.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  return session;
}