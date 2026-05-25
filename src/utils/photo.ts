import { BACKEND_URL } from './api';

export function resolvePhotoUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    if (url.startsWith('/uploads/')) {
        return `${BACKEND_URL}${url}`;
    }
    return url;
}
