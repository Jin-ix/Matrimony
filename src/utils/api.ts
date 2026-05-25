const getBackendUrl = () => {
    if (import.meta.env.VITE_BACKEND_URL) {
        return import.meta.env.VITE_BACKEND_URL;
    }
    // Fallback to the hostname that loaded the page (e.g. 192.168.1.x or localhost)
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `http://${hostname}:3001`;
};

export const BACKEND_URL = getBackendUrl();
export const API_URL = import.meta.env.VITE_API_URL || `${BACKEND_URL}/api`;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BACKEND_URL;
