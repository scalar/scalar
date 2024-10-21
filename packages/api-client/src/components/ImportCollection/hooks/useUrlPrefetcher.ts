import { isUrl } from '@/components/ImportCollection/utils/isUrl'
import { resolve } from '@scalar/import'
import { redirectToProxy, shouldUseProxy } from '@scalar/oas-utils/helpers'
import { reactive } from 'vue'

type PrefetchResult = {
  state: 'idle' | 'loading'
  content: string | null
  url: string | null
  error: string | null
}

/**
 * Fetches an URL and checks whether it could be an OpenAPI document
 */
export function useUrlPrefetcher() {
  const prefetchResult = reactive<PrefetchResult>({
    state: 'idle',
    content: null,
    url: null,
    error: null,
  })

  // TODO: This does not work with URLs to API references and such, we need @scalar/import to resolve those URLs
  // @see https://github.com/scalar/scalar/pull/3200
  async function prefetchUrl(value: string | null, proxy?: string) {
    // @ts-expect-error doesn’t allow null (yet)
    const urlOrDocument = await resolve(value)

    console.log('[@scalar/import]', value, '⭢', urlOrDocument)

    // No URL
    if (
      !urlOrDocument ||
      typeof urlOrDocument !== 'string' ||
      !isUrl(urlOrDocument)
    ) {
      return Object.assign(prefetchResult, {
        state: 'idle',
        content: null,
        url: null,
        error: null,
      })
    }

    Object.assign(prefetchResult, {
      state: 'loading',
      content: null,
      url: null,
      error: null,
    })

    // TODO: Remove wait
    // await new Promise((r) => setTimeout(r, 5000))

    try {
      const result = await fetch(
        shouldUseProxy(proxy, urlOrDocument)
          ? redirectToProxy(proxy, urlOrDocument)
          : urlOrDocument,
        {
          cache: 'no-store',
        },
      )

      // Failed!
      if (!result.ok) {
        // Retry without proxy if the initial request failed
        if (shouldUseProxy(proxy, urlOrDocument)) {
          const retryResult = await fetch(urlOrDocument, {
            cache: 'no-store',
          })

          if (retryResult.ok) {
            const content = await retryResult.text()

            return Object.assign(prefetchResult, {
              state: 'idle',
              content,
              url: urlOrDocument,
              error: null,
            })
          }
        }

        return Object.assign(prefetchResult, {
          state: 'idle',
          content: null,
          url: null,
          error: `Couldn’t fetch ${urlOrDocument}, got error ${[result.status, result.statusText].join(' ').trim()}.`,
        })
      }

      const content = await result.text()

      return Object.assign(prefetchResult, {
        state: 'idle',
        content,
        url: urlOrDocument,
        error: null,
      })
    } catch (error: any) {
      console.error('[prefetchDocument]', error)

      const message =
        error?.message === 'Failed to fetch'
          ? `Couldn’t reach ${urlOrDocument} — is it publicly accessible?`
          : error?.message

      return Object.assign(prefetchResult, {
        state: 'idle',
        content: null,
        url: null,
        error: message,
      })
    }
  }

  return {
    prefetchResult,
    prefetchUrl,
  }
}
