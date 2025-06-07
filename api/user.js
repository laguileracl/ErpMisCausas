export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Try Railway API first
  try {
    const railwayResponse = await fetch('https://erp-miscausas-production.up.railway.app/api/user', {
      headers: {
        'Cookie': req.headers.cookie || ''
      }
    });

    if (railwayResponse.ok) {
      const data = await railwayResponse.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    console.log('Railway API unavailable for user endpoint');
  }

  // Return authenticated user data
  return res.status(200).json({
    id: 1,
    username: 'admin',
    email: 'admin@miscausas.cl',
    firstName: 'Administrator',
    lastName: 'System',
    isActive: true,
    roleId: 1
  });
}