import { isUrl } from '@/components/ImportCollection/utils/isUrl'
import { redirectToProxy, shouldUseProxy } from '@scalar/oas-utils/helpers'
import { reactive } from 'vue'

type PrefetchResult = {
  state: 'idle' | 'loading'
  content: string | null
  error: string | null
}

/**
 * Fetches an URL and checks whether it could be an OpenAPI document
 */
export function useUrlPrefetcher() {
  const prefetchResult = reactive<PrefetchResult>({
    state: 'idle',
    content: null,
    error: null,
  })

  // TODO: This does not work with URLs to API references and such, we need @scalar/import to resolve those URLs
  // @see https://github.com/scalar/scalar/pull/3200
  async function prefetchUrl(value: string | null, proxy?: string) {
    // No URL
    if (!value || !isUrl(value)) {
      return Object.assign(prefetchResult, {
        state: 'idle',
        content: null,
        error: null,
      })
    }

    Object.assign(prefetchResult, {
      state: 'loading',
      content: null,
      error: null,
    })

    // TODO: Remove wait
    // await new Promise((resolve) => setTimeout(resolve, 5000))

    try {
      const result = await fetch(
        shouldUseProxy(proxy, value) ? redirectToProxy(proxy, value) : value,
        {
          cache: 'no-store',
        },
      )

      if (!result.ok) {
        return Object.assign(prefetchResult, {
          state: 'idle',
          content: null,
          error: `Couldn’t fetch ${value}, got error ${[result.status, result.statusText].join(' ').trim()}.`,
        })
      }

      const content = await result.text()

      return Object.assign(prefetchResult, {
        state: 'idle',
        content,
        error: null,
      })
    } catch (error: any) {
      console.error('[prefetchDocument]', error)

      const message =
        error?.message === 'Failed to fetch'
          ? `Couldn’t reach ${value} — is it publicly accessible?`
          : error?.message

      return Object.assign(prefetchResult, {
        state: 'idle',
        content: null,
        error: message,
      })
    }
  }

  return {
    prefetchResult,
    prefetchUrl,
  }
}
