// Utility to get the API URL at runtime
// Priority: 1. VITE_API_URL from build (if not default), 2. Production backend URL, 3. Same origin with port 4000, 4. localhost:4000
export const getApiUrl = () => {
  // If explicitly set during build and not the default, use it
  const viteApiUrl = import.meta.env.VITE_API_URL;
  if (viteApiUrl && viteApiUrl !== 'http://localhost:4000') {
    console.log('🔗 Using VITE_API_URL from build:', viteApiUrl);
    return viteApiUrl;
  }
  
  // If running in browser, check if we're in production
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    
    // If hostname is not localhost (production), try to use backend subdomain
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Specific case: zeroone.sudheerbhuvana.in -> erpbackend.sudheerbhuvana.in
      if (hostname === 'zeroone.sudheerbhuvana.in') {
        const backendUrl = `${protocol}//erpbackend.sudheerbhuvana.in`;
        console.log('🔗 Detected production (zeroone), using backend URL:', backendUrl);
        return backendUrl;
      }
      
      // Try common backend subdomain patterns
      // If frontend is at erp.sudheerbhuvana.in, backend might be at erpbackend.sudheerbhuvana.in
      if (hostname.includes('erp') && !hostname.includes('backend')) {
        // Replace frontend subdomain with backend subdomain
        const backendHostname = hostname.replace(/erp(?!backend)/, 'erpbackend');
        const backendUrl = `${protocol}//${backendHostname}`;
        console.log('🔗 Detected production, using backend URL:', backendUrl);
        return backendUrl;
      }
      
      // If frontend is at a different domain, try erpbackend subdomain
      const domainParts = hostname.split('.');
      if (domainParts.length >= 2) {
        const baseDomain = domainParts.slice(-2).join('.'); // Get domain.com
        const backendUrl = `${protocol}//erpbackend.${baseDomain}`;
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

