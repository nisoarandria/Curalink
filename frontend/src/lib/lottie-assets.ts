type LottieJson = Record<string, unknown>;

const cache = new Map<string, Promise<LottieJson>>();

export function fetchLottieAsset(path: string): Promise<LottieJson> {
  const cached = cache.get(path);
  if (cached) return cached;

  const promise = fetch(path)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Impossible de charger l'animation Lottie: ${path}`);
      }
      return response.json() as Promise<LottieJson>;
    })
    .catch((error) => {
      cache.delete(path);
      throw error;
    });

  cache.set(path, promise);
  return promise;
}

export const LOTTIE_LOADING = "/loading.json";
export const LOTTIE_NODATA = "/nodata.json";
