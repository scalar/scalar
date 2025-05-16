import { fetchDocument, prettyPrintJson } from '@scalar/oas-utils/helpers'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { SpecConfiguration } from '@scalar/types/api-reference'
import { type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

/**
 * Pass a configuration object containg content or an URL, and retrieve the OpenAPI document as a string.
 */
export function useDocumentFetcher({
  configuration,
}: {
  configuration?: MaybeRefOrGetter<Pick<ApiReferenceConfiguration, 'url' | 'content' | 'proxyUrl'>>
}) {
  /** OpenAPI document as a string */
  const originalDocument = ref<string>('')

  watch(
    () => toValue(configuration),
    async (newConfig) => {
      if (!newConfig) {
        return
      }

      const content = await getContent(newConfig, toValue(configuration)?.proxyUrl)

      if (typeof content === 'string') {
        originalDocument.value = content.trim()
      }
    },
    { immediate: true, deep: true },
  )

  return {
    originalDocument,
  }
}

/**
 * Get the content from the provided configuration:
 *
 * 1. If the URL is provided, fetch the spec from the URL.
 * 2. If the content is a string, return it.
 * 3. If the content is an object, stringify it.
 * 4. If the content is a function, call it and get the content.
 * 5. Otherwise, return an empty string.
 */
const getContent = async ({ url, content }: SpecConfiguration, proxyUrl?: string): Promise<string | undefined> => {
  // Fetch from URL
  if (url) {
    const start = performance.now()

    try {
      const result = await fetchDocument(url, proxyUrl)

      const end = performance.now()
      console.log(`fetch: ${Math.round(end - start)} ms (${url})`)
      console.log('size:', Math.round(result.length / 1024), 'kB')

      return result
    } catch (error) {
      console.error('Failed to fetch OpenAPI document from URL:', error)
    }
  }

  // Use a callback
  const result = typeof content === 'function' ? content() : content

  // Strings are fine
  if (typeof result === 'string') {
    return result
  }

  // Pretty print objects
  if (typeof result === 'object') {
    return prettyPrintJson(result)
  }

  return undefined
}
