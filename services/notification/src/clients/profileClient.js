const createProfileClient = ({ getBaseUrl, resourcePath, request = fetch }) => ({
  isConfigured: () => Boolean(getBaseUrl()),
  getById: async (id) => {
    const baseUrl = getBaseUrl();
    if (!baseUrl) return null;
    const response = await request(`${baseUrl.replace(/\/$/, '')}${resourcePath}/${encodeURIComponent(id)}`, {
      headers: {
        'X-Internal-Call': 'true',
        'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET || ''
      }
    });
    if (!response.ok) return null;
    return response.json();
  }
});

module.exports = { createProfileClient };
