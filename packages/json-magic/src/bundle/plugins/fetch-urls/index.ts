import { createLimiter } from '@scalar/helpers/general/create-limiter'

import type { LoaderPlugin, ResolveResult } from '@/bundle'
import { isHttpUrl } from '@/helpers/is-http-url'
import { normalize } from '@/helpers/normalize'

import { type FetchBudget, type RemoteFetchLimits, createFetchBudget, readBoundedBody, withAbort } from './fetch-budget'

type FetchConfig = Partial<{
  headers: { headers: HeadersInit; domains: string[] }[]
  /** Custom transports cannot be combined with blockPrivateNetworks. */
  fetch: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>
  /**
   * When true, refuse to fetch URLs that resolve to a private, loopback, link-local, or otherwise
   * internal address. Only enforced in Node, where DNS resolution is available. Off by default so
   * existing callers keep working unchanged.
   */
  blockPrivateNetworks: boolean
  /** Shared document limits; enabled by default with blockPrivateNetworks. Use a fresh plugin per bundle. */
  limits: Partial<RemoteFetchLimits>
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
  budget?: FetchBudget,
): Promise<ResolveResult> {
  try {
    const host = getHost(url)
    const headers = config?.headers?.find((a) => a.domains.find((d) => d === host) !== undefined)?.headers
    const guarded = config?.blockPrivateNetworks && typeof window === 'undefined'

    const activeBudget = budget ?? (guarded || config?.limits ? createFetchBudget(config?.limits) : undefined)
    const signal = activeBudget?.start()
    const result = await limiter(async () => {
      signal?.throwIfAborted()
      if (guarded) {
        // A custom fetch can ignore the pinned connection and resolve the host again.
        if (config?.fetch) {
          throw new Error('Custom fetch cannot be combined with private network blocking')
        }
        const { fetchPublicUrl } = await import('./fetch-public-url')
        return fetchPublicUrl(url, headers, activeBudget, signal)
      }

      const request = (config?.fetch ?? fetch)(url, { headers, ...(signal ? { signal } : {}) })
      return signal ? withAbort(request, signal) : request
    })

    if (result.ok) {
      const body =
        activeBudget && signal && !guarded
          ? new TextDecoder().decode(await readBoundedBody(result.body, activeBudget, signal))
          : await result.text()

      return {
        ok: true,
        data: normalize(body),
        raw: body,
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

  const budget = config?.blockPrivateNetworks || config?.limits ? createFetchBudget(config?.limits) : undefined

  return {
    type: 'loader',
    validate: isHttpUrl,
    exec: (value) => fetchUrl(value, limiter, config, budget),
  }
}
