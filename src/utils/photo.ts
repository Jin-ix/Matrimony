const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function resolvePhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('/uploads/')) {
        return `${BACKEND_URL}${url}`;
    }
    return url;
}
