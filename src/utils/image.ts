export const imageCache = new Map<string, string>();

// Stable session ID — survives re-renders but not page reloads
const sessionId = Math.random().toString(36).slice(2, 10);

export const getSafeImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    // Firebase Storage URLs already have a unique token — don't add cache-buster
    if (url.includes('token=')) return url;
    if (!imageCache.has(url)) {
        const separator = url.includes('?') ? '&' : '?';
        imageCache.set(url, `${url}${separator}c=${sessionId}`);
    }
    return imageCache.get(url)!;
};
