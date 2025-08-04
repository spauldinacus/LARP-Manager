// Health check endpoint for Vercel deployment
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      message: "Thrune LARP Character Management System is running",
      version: "1.0.0"
    });
  }
  return res.status(405).json({ message: 'Method not allowed' });
}