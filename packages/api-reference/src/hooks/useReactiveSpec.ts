import { fetchDocument, prettyPrintJson } from '@scalar/oas-utils/helpers'
import type { SpecConfiguration } from '@scalar/types/api-reference'
import { type MaybeRefOrGetter, ref, toValue, watch } from 'vue'

import { createEmptySpecification } from '../helpers'
import { parse } from '../helpers/parse'

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
  const activeContent = typeof content === 'function' ? content() : content

  // Strings are fine
  if (typeof activeContent === 'string') {
    return activeContent
  }

  // Pretty print objects
  if (typeof activeContent === 'object') {
    return prettyPrintJson(activeContent)
  }

  return undefined
}

/**
 * Keep the raw spec content in a ref and update it when the configuration changes.
 */
export function useReactiveSpec({
  specConfig,
  proxyUrl,
}: {
  specConfig?: MaybeRefOrGetter<SpecConfiguration>
  proxyUrl?: MaybeRefOrGetter<string>
}) {
  /** OAS spec as a string */
  const rawSpec = ref<string>('')
  /** Fully parsed and resolved OAS object */
  const parsedSpec = ref(createEmptySpecification())
  /** Parser error messages when parsing fails */
  const specErrors = ref<string | null>(null)

  /**
   * Parse the raw spec string into a resolved object
   * If there is an empty string (or no string) fallback to the default
   * If there are errors continue to show the previous valid spec
   */
  function parseInput(value?: string) {
    if (!value) {
      parsedSpec.value = createEmptySpecification()
      return
    }

    parse(value, {
      proxyUrl: proxyUrl ? toValue(proxyUrl) : undefined,
    })
      .then((validSpec) => {
        specErrors.value = null

        // Some specs don’t have servers, make sure they are defined
        parsedSpec.value = validSpec
      })
      .catch((error) => {
        // Save the parse error message to display
        specErrors.value = error.toString()
      })
  }

  watch(
    () => toValue(specConfig),
    async (newConfig) => {
      if (newConfig) {
        const specContent = (await getContent(newConfig, toValue(proxyUrl)))?.trim()
        if (typeof specContent === 'string') {
          rawSpec.value = specContent
        }
      }
    },
    { immediate: true, deep: true },
  )

  watch(rawSpec, () => {
    parseInput(rawSpec.value)
  })

  return {
    rawSpec,
    parsedSpec,
    specErrors,
  }
}
