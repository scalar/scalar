import type { LoaderPlugin, ResolveResult } from '@/bundle'
import { isRemoteUrl } from '@/bundle/bundle'
import { createLimiter } from '@/bundle/create-limiter'
import { normalize } from '@/helpers/normalize'

type FetchConfig = Partial<{
  headers: { headers: HeadersInit; domains: string[] }[]
  fetch: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>
}>

/**
 * Safely checks for host from a URL
 * Needed because we cannot create a URL from a relative remote URL ex: examples/openapi.json
 */
const getHost = (url: string): string | null => {
  try {
    return new URL(url).host
  } catch {
    return null
  }
}

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
    const host = getHost(url)

    // Get the headers that match the domain
    const headers = config?.headers?.find((a) => a.domains.find((d) => d === host) !== undefined)?.headers

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

    const contentType = result.headers.get('Content-Type') ?? ''

    // Warn if the content type is HTML or XML as we only support JSON/YAML
    if (['text/html', 'application/xml'].includes(contentType)) {
      console.warn(`[WARN] We only support JSON/YAML formats, received ${contentType}`)
    }

    console.warn(`[WARN] Fetch failed with status ${result.status} ${result.statusText} for URL: ${url}`)
    return {
      ok: false,
    }
  } catch {
    console.warn(`[WARN] Failed to parse JSON/YAML from URL: ${url}`)
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
export function fetchUrls(config?: FetchConfig & Partial<{ limit: number | null }>): LoaderPlugin {
  // If there is a limit specified we limit the number of concurrent calls
  const limiter = config?.limit ? createLimiter(config.limit) : <T>(fn: () => Promise<T>) => fn()

  return {
    type: 'loader',
    validate: isRemoteUrl,
    exec: (value) => fetchUrl(value, limiter, config),
  }
}
