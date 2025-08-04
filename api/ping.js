
// Simple ping endpoint for Vercel
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  return res.status(200).json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
}
