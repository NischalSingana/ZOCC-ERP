// Utility to get the API URL at runtime
// Priority: 1. VITE_API_URL from build (if not default), 2. Same origin with port 4000, 3. localhost:4000
export const getApiUrl = () => {
  // If explicitly set during build and not the default, use it
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl && viteApiUrl !== 'http://localhost:4000') {
    return viteApiUrl;
  }
  
  // If running in browser, try to construct from current location
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    // Use same protocol and hostname, but port 4000 for backend
    // This works for Docker Compose where both are on same host
    return `${protocol}//${hostname}:4000`;
  }
  
  // Fallback for SSR or other environments
  return 'http://localhost:4000';
};

// Export the API URL as a constant
export const API_URL = getApiUrl();

