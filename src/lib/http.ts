import { UpstreamInvalidResponseError } from '../errors/api-error.js';

const REQUEST_TIMEOUT_MS = 8_000;

export async function fetchJson<T>(
  url: string,
  apiName: 'Genderize' | 'Agify' | 'Nationalize',
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new UpstreamInvalidResponseError(apiName);
    }

    const data = (await response.json()) as T;
    return data;
  } catch {
    throw new UpstreamInvalidResponseError(apiName);
  } finally {
    clearTimeout(timeout);
  }
}
