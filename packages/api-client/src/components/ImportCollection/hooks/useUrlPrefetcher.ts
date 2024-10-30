import { isUrl } from '@/libs'
import { resolve } from '@scalar/import'
import {
  fetchWithProxyFallback,
  redirectToProxy,
} from '@scalar/oas-utils/helpers'
import { reactive } from 'vue'

export type PrefetchResult = {
  state: 'idle' | 'loading'
  content: string | null
  input: string | null
  url: string | null
  error: string | null
}

/**
 * Core logic for fetching and processing a URL
 */
export function createUrlPrefetcher() {
  async function prefetchUrl(input: string | null, proxy?: string) {
    if (!input || typeof input !== 'string') {
      return {
        state: 'idle',
        content: null,
        url: null,
        input,
        error: null,
      }
    }

    try {
      // If we try hard enough, we might find the actual OpenAPI document URL even if the input isn’t one directly.
      const urlOrDocument = await resolve(input, {
        fetch: (url) => {
          return fetch(proxy ? redirectToProxy(proxy, url) : url, {
            cache: 'no-cache',
          })
        },
      })

      // If the input is an object, we’re done
      if (typeof urlOrDocument === 'object' && urlOrDocument !== null) {
        const json = JSON.stringify(urlOrDocument, null, 2)

        return { state: 'idle', content: json, url: input, error: null }
      }

      // Nothing was found.
      if (urlOrDocument === undefined) {
        return {
          state: 'idle',
          content: null,
          url: null,
          input,
          error: `Could not find an OpenAPI document in ${input}`,
        }
      }

      if (!isUrl(urlOrDocument)) {
        return {
          state: 'idle',
          content: null,
          url: null,
          input,
          error: `Oops, we got invalid content for the given URL.`,
        }
      }

      const url = urlOrDocument

      // Okay, we’ve got an URL. Let’s fetch it:
      const result = await fetchWithProxyFallback(url, {
        proxy,
        cache: 'no-cache',
      })

      if (!result.ok) {
        return {
          state: 'idle',
          content: null,
          url: null,
          input,
          error: `Couldn’t fetch ${url}, got error ${[result.status, result.statusText].join(' ').trim()}.`,
        }
      }

      const content = await result.text()

      return {
        state: 'idle',
        content,
        // This is the resolved URL, doesn’t have to be the given URL.
        url,
        error: null,
      }
    } catch (error: any) {
      console.error('[prefetchDocument]', error)

      const message = error?.message?.includes('Can’t fetch')
        ? `Couldn’t reach the URL (${input}). Is it publicly accessible?`
        : error?.message

      return {
        state: 'idle',
        content: null,
        url: null,
        input,
        error: message,
      }
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
    input: null,
    error: null,
  })

  const { prefetchUrl } = createUrlPrefetcher()

  async function prefetchUrlAndUpdateState(
    input: string | null,
    proxy?: string,
  ) {
    Object.assign(prefetchResult, {
      state: 'loading',
      content: null,
      url: null,
      input,
      error: null,
    })

    const result = await prefetchUrl(input, proxy)

    Object.assign(prefetchResult, result)

    return result
  }

  return {
    prefetchResult,
    prefetchUrl: prefetchUrlAndUpdateState,
  }
}
