import { fetchWithProxyFallback } from '@scalar/oas-utils/helpers'
import { reactive } from 'vue'

type PrefetchResult = {
  state: 'idle' | 'loading'
  content: string | null
  url: string | null
  error: string | null
}

/**
 * Core logic for fetching and processing a URL
 */
export function createUrlPrefetcher() {
  async function prefetchUrl(value: string | null, proxy?: string) {
    if (!value || typeof value !== 'string') {
      return { state: 'idle', content: null, url: null, error: null }
    }

    try {
      const result = await fetchWithProxyFallback(value, proxy)

      if (!result.ok) {
        return {
          state: 'idle',
          content: null,
          url: null,
          error: `Couldn't fetch ${value}, got error ${[result.status, result.statusText].join(' ').trim()}.`,
        }
      }

      const content = await result.text()

      return { state: 'idle', content, url: value, error: null }
    } catch (error: any) {
      console.error('[prefetchDocument]', error)

      const message = error?.message?.includes('Can’t fetch')
        ? `Couldn't reach ${value} — is it publicly accessible?`
        : error?.message

      return { state: 'idle', content: null, url: null, error: message }
    }
  }

  return { prefetchUrl }
}

/**
 * Vue composable for URL prefetching
 */
export function useUrlPrefetcher() {
  const prefetchResult = reactive<PrefetchResult>({
    state: 'idle',
    content: null,
    url: null,
    error: null,
  })

  const { prefetchUrl } = createUrlPrefetcher()

  async function prefetchUrlAndUpdateState(
    value: string | null,
    proxy?: string,
  ) {
    Object.assign(prefetchResult, {
      state: 'loading',
      content: null,
      url: null,
      error: null,
    })

    const result = await prefetchUrl(value, proxy)

    Object.assign(prefetchResult, result)

    return result
  }

  return {
    prefetchResult,
    prefetchUrl: prefetchUrlAndUpdateState,
  }
}
