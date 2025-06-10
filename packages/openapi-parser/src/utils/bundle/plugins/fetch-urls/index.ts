import { normalize } from '@/utils/normalize'
import { isRemoteUrl, type Plugin, type ResolveResult } from '@/utils/bundle/bundle'
import { createLimiter } from '@/utils/bundle/create-limiter'

type FetchConfig = Partial<{
  headers: { headers: HeadersInit; domains: string[] }[]
  fetch: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>
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
    const domain = new URL(url).host

    // Get the headers that match the domain
    const headers = config?.headers?.find((a) => a.domains.find((d) => d === domain) !== undefined)?.headers

    const exec = config?.fetch ?? fetch

    const result = await limiter(() =>
      exec(url, {
        headers,
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
    validate: isRemoteUrl,
    exec: (value) => fetchUrl(value, limiter, config),
  }
}
