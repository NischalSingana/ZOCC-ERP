// Utility to get the API URL at runtime
// Priority: 1. VITE_API_URL from build (if set), 2. Production backend URL, 3. Same origin with port 4000, 4. localhost:4000
export const getApiUrl = () => {
  // ALWAYS use VITE_API_URL if it's set (even if it's localhost for dev)
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl) {
    console.log('🔗 Using VITE_API_URL from build:', viteApiUrl);
    return viteApiUrl;
  }
  
  // If running in browser, check if we're in production
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    
    // If hostname is not localhost (production), use backend.nischalsingana.com
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // If frontend is at nischalsingana.com domain, use backend.nischalsingana.com
      if (hostname.includes('nischalsingana.com') && hostname !== 'backend.nischalsingana.com') {
        const backendUrl = `${protocol}//backend.nischalsingana.com`;
        console.log('🔗 Detected nischalsingana.com domain, using backend URL:', backendUrl);
        return backendUrl;
      }
      
      // If already on backend.nischalsingana.com, use same origin
      if (hostname === 'backend.nischalsingana.com') {
        const backendUrl = `${protocol}//${hostname}`;
        console.log('🔗 Already on backend domain, using same origin:', backendUrl);
        return backendUrl;
      }
      
      // For other production domains, try backend subdomain pattern
      const domainParts = hostname.split('.');
      if (domainParts.length >= 2) {
        const baseDomain = domainParts.slice(-2).join('.'); // Get domain.com
        const backendUrl = `${protocol}//backend.${baseDomain}`;
        console.log('🔗 Detected production, trying backend URL:', backendUrl);
        return backendUrl;
      }
    }
    
    // For localhost or same-host deployments, use same hostname with port 4000
    return `${protocol}//${hostname}:4000`;
  }
  
  // Fallback for SSR or other environments
  return 'http://localhost:4000';
};

// Export the API URL as a constant
export const API_URL = getApiUrl();

// Log the API URL for debugging (always log in production too)
console.log('🔗 API URL:', API_URL);
console.log('🔗 Current location:', typeof window !== 'undefined' ? window.location.href : 'SSR');

