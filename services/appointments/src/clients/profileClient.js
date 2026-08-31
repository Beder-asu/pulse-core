const createProfileClient = ({ getBaseUrl, resourcePath, request = fetch }) => ({
  getById: async (id, authHeader) => {
    const baseUrl = getBaseUrl();
    if (!baseUrl) return null;
    const response = await request(`${baseUrl.replace(/\/$/, '')}${resourcePath}/${encodeURIComponent(id)}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        'X-Internal-Call': 'true',
        'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET || ''
      }
    });
    if (!response.ok) return null;
    return response.json();
  }
});

module.exports = { createProfileClient };
