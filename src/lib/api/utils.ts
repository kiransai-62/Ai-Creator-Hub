export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const isValidUUID = (id: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export function getOptimizedImageUrl(url: string, width = 400, height = 300) {
  if (!url) return '';
  if (width && height) {
    return url;
  }
  return url;
}
