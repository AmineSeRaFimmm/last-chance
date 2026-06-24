const loadedImageUrls = new Set<string>();
const pendingImageUrls = new Map<string, Promise<void>>();

export const EXERCISE_MEDIA_CACHE_NAME = "last-chance-exercise-media-v1";

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

  const request = cacheImageResponse(url)
    .catch(() => undefined)
    .then(() => decodeImage(url))
    .finally(() => {
      pendingImageUrls.delete(url);
    });

  pendingImageUrls.set(url, request);
  return request;
}

export function warmImageCache(urls: Array<string | undefined>, limit = 12): void {
  if (typeof window === "undefined") return;
  const targets = getUniqueUrls(urls).slice(0, limit);
  void preloadImages(targets, 3, 0);
}

export function warmPersistentImageCache(urls: Array<string | undefined>, limit = 72, concurrency = 2): void {
  if (typeof window === "undefined") return;
  const targets = getUniqueUrls(urls).slice(0, limit);
  if (targets.length === 0) return;

  scheduleIdleWork(() => {
    void preloadImages(targets, concurrency, 120);
  });
}

async function cacheImageResponse(url: string): Promise<void> {
  if (!("caches" in window)) return;

  const cache = await window.caches.open(EXERCISE_MEDIA_CACHE_NAME);
  const cached = await cache.match(url);
  if (cached) {
    loadedImageUrls.add(url);
    return;
  }

  const response = await fetch(url, {
    cache: "force-cache",
    credentials: "omit",
    mode: "cors"
  });

  if (response.ok || response.type === "opaque") {
    await cache.put(url, response.clone());
  }
}

function decodeImage(url: string): Promise<void> {
  if (loadedImageUrls.has(url)) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      loadedImageUrls.add(url);
      resolve();
    };
    image.onerror = () => {
      resolve();
    };
    image.src = url;
  });
}

async function preloadImages(urls: string[], concurrency: number, pauseMs: number): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, urls.length)) }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor];
      cursor += 1;
      await preloadImage(url);
      if (pauseMs > 0) await pause(pauseMs);
    }
  });

  await Promise.all(workers);
}

function getUniqueUrls(urls: Array<string | undefined>): string[] {
  return urls
    .filter((url): url is string => Boolean(url))
    .filter((url, index, list) => list.indexOf(url) === index);
}

function scheduleIdleWork(task: () => void): void {
  const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number };
  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(task, { timeout: 3000 });
    return;
  }

  window.setTimeout(task, 900);
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
