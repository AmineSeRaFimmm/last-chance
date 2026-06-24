const loadedImageUrls = new Set<string>();
const pendingImageUrls = new Map<string, Promise<void>>();

export function isImageCached(url: string | undefined): boolean {
  return Boolean(url && loadedImageUrls.has(url));
}

export function markImageCached(url: string | undefined): void {
  if (url) loadedImageUrls.add(url);
}

export function preloadImage(url: string | undefined): Promise<void> {
  if (!url || typeof window === "undefined") return Promise.resolve();
  if (loadedImageUrls.has(url)) return Promise.resolve();

  const pending = pendingImageUrls.get(url);
  if (pending) return pending;

  const request = new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      loadedImageUrls.add(url);
      pendingImageUrls.delete(url);
      resolve();
    };
    image.onerror = () => {
      pendingImageUrls.delete(url);
      resolve();
    };
    image.src = url;
  });

  pendingImageUrls.set(url, request);
  return request;
}

export function warmImageCache(urls: Array<string | undefined>, limit = 12): void {
  if (typeof window === "undefined") return;

  urls
    .filter((url): url is string => Boolean(url))
    .filter((url, index, list) => list.indexOf(url) === index)
    .slice(0, limit)
    .forEach((url) => {
      void preloadImage(url);
    });
}
