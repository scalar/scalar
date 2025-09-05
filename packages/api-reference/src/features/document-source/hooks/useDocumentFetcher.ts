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
  configuration?: MaybeRefOrGetter<Pick<ApiReferenceConfiguration, 'url' | 'content' | 'proxyUrl' | 'fetch'>>
}) {
  /** OpenAPI document as a string */
  const originalDocument = ref<string>('')

  watch(
    () => toValue(configuration),
    async (newConfig) => {
      if (!newConfig) {
        return
      }

      const content = await getContent(newConfig, toValue(configuration)?.proxyUrl, toValue(configuration)?.fetch)

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
const getContent = async (
  { url, content }: SpecConfiguration,
  proxyUrl?: string,
  fetch?: (input: string | URL | globalThis.Request, init?: RequestInit) => Promise<Response>,
): Promise<string | undefined> => {
  // Fetch from URL only if we do not already have the content
  if (url && !content) {
    try {
      const result = await fetchDocument(url, proxyUrl, fetch)

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
