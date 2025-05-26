import { normalize } from '../../normalize'
import { isRemoteUrl, type Plugin, type ResolveResult } from '../bundle'
import { createLimiter } from '../create-limiter'

type FetchConfig = Partial<{
  auth: { token: string; type: 'bearer'; domains: string[] }[]
}>

/**
 * Fetches and normalizes data from a remote URL
 * @param url - The URL to fetch data from
 * @returns A promise that resolves to either the normalized data or an error result
 * @example
 * ```ts
 * const result = await fetchUrl('https://api.example.com/data.json')
 * if (result.ok) {
 *   console.log(result.data) // The normalized data
 * } else {
 *   console.log('Failed to fetch data')
 * }
 * ```
 */
export async function fetchUrl(
  url: string,
  limiter: <T>(fn: () => Promise<T>) => Promise<T>,
  config?: FetchConfig,
): Promise<ResolveResult> {
  try {
    const domain = new URL(url).hostname

    // We can attach the auth header if the auth matches
    const auth = config?.auth?.find((a) => a.domains.find((d) => d === domain) !== undefined)

    // TODO: handle different kind of authorization
    const headers = auth ? { 'Authorization': `Bearer ${auth.token}` } : {}

    const result = await limiter(() =>
      fetch(url, {
        headers: {
          ...headers,
        },
      }),
    )

    if (result.ok) {
      const body = await result.text()

      return {
        ok: true,
        data: normalize(body),
      }
    }

    return {
      ok: false,
    }
  } catch {
    return {
      ok: false,
    }
  }
}

/**
 * Creates a plugin for handling remote URL references.
 * This plugin validates and fetches data from HTTP/HTTPS URLs.
 *
 * @returns A plugin object with validate and exec functions
 * @example
 * const urlPlugin = fetchUrls()
 * if (urlPlugin.validate('https://example.com/schema.json')) {
 *   const result = await urlPlugin.exec('https://example.com/schema.json')
 * }
 */
export function fetchUrls(config?: FetchConfig & Partial<{ limit: number | null }>): Plugin {
  // If there is a limit specified we limit the number of concurrent calls
  const limiter = config?.limit ? createLimiter(config.limit) : <T>(fn: () => Promise<T>) => fn()

  return {
    validate: (value) => isRemoteUrl(value),
    exec: (value) => fetchUrl(value, limiter, config),
  }
}
