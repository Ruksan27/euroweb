// Central API base URL - change this for production
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5005';

export const API = {
  base: API_BASE,
  cv: `${API_BASE}/api/cv`,
  ai: `${API_BASE}/api/ai`,
  admin: `${API_BASE}/api/admin`,
};

export default API;
