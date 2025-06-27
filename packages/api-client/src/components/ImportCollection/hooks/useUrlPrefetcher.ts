import { isUrl } from '@/libs'
import { resolve } from '@scalar/import'
import { fetchWithProxyFallback, redirectToProxy } from '@scalar/oas-utils/helpers'
import { reactive } from 'vue'

export type PrefetchResult = {
  state: 'idle' | 'loading'
  content: string | null
  input: string | null
  url: string | null
  error: string | null
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

  async function resetPrefetchResult() {
    Object.assign(prefetchResult, {
      state: 'idle',
      content: null,
      url: null,
      input: null,
      error: null,
    })
  }

  async function prefetchUrl(input: string | null, proxyUrl?: string) {
    if (!input) {
      return {
        state: 'idle',
        content: null,
        url: null,
        input,
        error: null,
      }
    }

    try {
      // If we try hard enough, we might find the actual OpenAPI document URL even if the input isn't one directly.
      const urlOrDocument = await resolve(input, {
        fetch: (url) => {
          return fetch(proxyUrl ? redirectToProxy(proxyUrl, url) : url, {
            cache: 'no-cache',
          })
        },
      })

      // If the input is an object, we're done
      if (typeof urlOrDocument === 'object' && urlOrDocument !== null) {
        const json = JSON.stringify(urlOrDocument, null, 2)

        return {
          state: 'idle',
          content: json,
          url: null,
          error: null,
        }
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
          error: 'Oops, we got invalid content for the given URL.',
        }
      }

      const url = urlOrDocument

      // Okay, we've got an URL. Let's fetch it:
      const result = await fetchWithProxyFallback(url, {
        proxyUrl,
        cache: 'no-cache',
      })

      if (!result.ok) {
        return {
          state: 'idle',
          content: null,
          url: null,
          input,
          error: `Couldn't fetch ${url}, got error ${[result.status, result.statusText].join(' ').trim()}.`,
        }
      }

      const content = await result.text()

      return {
        state: 'idle',
        content,
        url,
        error: null,
      }
    } catch (error: any) {
      console.error('[prefetchDocument]', error)

      return {
        state: 'idle',
        content: null,
        url: null,
        input,
        error: error.message,
      }
    }
  }

  async function prefetchUrlAndUpdateState(input: string | null, proxyUrl?: string) {
    Object.assign(prefetchResult, {
      state: 'loading',
      content: null,
      url: null,
      input,
      error: null,
    })

    const result = await prefetchUrl(input, proxyUrl)
    Object.assign(prefetchResult, result)
    return result
  }

  return {
    prefetchResult,
    prefetchUrl: prefetchUrlAndUpdateState,
    resetPrefetchResult,
  }
}
