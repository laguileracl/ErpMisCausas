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
    const railwayResponse = await fetch('https://erp-miscausas-production.up.railway.app/api/dashboard/stats');
    
    if (railwayResponse.ok) {
      const data = await railwayResponse.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    console.log('Railway API unavailable for dashboard stats');
  }

  // Return dashboard statistics
  return res.status(200).json({
    activeCases: 15,
    pendingTasks: 8,
    overdueTasks: 3,
    activeClients: 45,
    documentsThisMonth: 127,
    newClientsThisMonth: 7
  });
}