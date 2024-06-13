import type { SpecConfiguration } from '@scalar/oas-utils'
import { fetchSpecFromUrl, prettyPrintJson } from '@scalar/oas-utils/helpers'
import { type MaybeRefOrGetter, reactive, ref, toValue, watch } from 'vue'

import { createEmptySpecification, isValidUrl } from '../helpers'
import { parse } from '../helpers/parse'

/**
 * Get the spec content from the provided configuration:
 *
 * 1. If the URL is provided, fetch the spec from the URL.
 * 2. If the content is a string, return it.
 * 3. If the content is an object, stringify it.
 * 4. If the content is a function, call it and get the content.
 * 5. Otherwise, return an empty string.
 */
const getSpecContent = async (
  { url, content }: SpecConfiguration,
  proxy?: string,
): Promise<string | undefined> => {
  // If the URL is provided, fetch the API definition from the URL
  if (url) {
    if (!isValidUrl(url)) {
      // If the url is not valid, we can assume its a path and
      // if it’s a path we can skip the proxy.
      return await fetchSpecFromUrl(url)
    }

    return await fetchSpecFromUrl(url, proxy)
  }

  // Callback
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
  proxy,
}: {
  specConfig?: MaybeRefOrGetter<SpecConfiguration>
  proxy?: MaybeRefOrGetter<string>
}) {
  /** OAS spec as a string */
  const rawSpec = ref('')
  /** Fully parsed and resolved OAS object */
  const parsedSpec = reactive(createEmptySpecification())
  /** Parser error messages when parsing fails */
  const specErrors = ref<string | null>(null)

  /**
   * Parse the raw spec string into a resolved object
   * If there is an empty string (or no string) fallback to the default
   * If there are errors continue to show the previous valid spec
   */
  function parseInput(value?: string) {
    if (!value) return Object.assign(parsedSpec, createEmptySpecification())

    return parse(value, {
      proxy: proxy ? toValue(proxy) : undefined,
    })
      .then((validSpec) => {
        specErrors.value = null

        // Some specs don’t have servers, make sure they are defined
        Object.assign(parsedSpec, {
          servers: [],
          ...validSpec,
        })
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
        const specContent = (
          await getSpecContent(newConfig, toValue(proxy))
        )?.trim()
        if (typeof specContent === 'string') rawSpec.value = specContent
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
