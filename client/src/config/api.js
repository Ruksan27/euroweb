// Central API base URL - change this for production
const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    // For local network mobile testing, if API URL is localhost but accessed via IP
    if (import.meta.env.VITE_API_URL.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
       return `http://${window.location.hostname}:5005`;
    }
    return import.meta.env.VITE_API_URL;
  }
  // Default fallback
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:5005`;
  }
  return 'http://localhost:5005';
};

const API_BASE = getApiBase();

export const API = {
  base: API_BASE,
  cv: `${API_BASE}/api/cv`,
  ai: `${API_BASE}/api/ai`,
  admin: `${API_BASE}/api/admin`,
  user: `${API_BASE}/api/user`,
};

export default API;
