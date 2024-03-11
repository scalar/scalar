import { fetchSpecFromUrl } from '@scalar/oas-utils'
import { type MaybeRefOrGetter, reactive, ref, toValue, watch } from 'vue'

import { isValidUrl } from '../helpers'
import { parse } from '../helpers/parse'
import type { Spec, SpecConfiguration } from '../types'

// Generate a new empty spec instance
export const emptySpecGenerator = (): Spec => ({
  info: {
    title: '',
    description: '',
    termsOfService: '',
    version: '',
    license: {
      name: '',
      url: '',
    },
    contact: {
      email: '',
    },
  },
  externalDocs: {
    description: '',
    url: '',
  },
  components: {
    schemas: {},
    securitySchemes: {},
  },
  servers: [],
  tags: [],
})

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
  if (url) {
    if (!isValidUrl(url)) {
      // if the url is not valid, we can assume its a path
      // and if it's a path we don't need to fetch from a proxy
      // since it's served with the file
      return await fetchSpecFromUrl(url)
    }
    return await fetchSpecFromUrl(url, proxy)
  }

  const activeContent = typeof content === 'function' ? content() : content
  if (typeof activeContent === 'string') return activeContent
  if (typeof activeContent === 'object') return JSON.stringify(activeContent)

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
  const parsedSpec = reactive(emptySpecGenerator())
  /** Parser error messages when parsing fails */
  const specErrors = ref<string | null>(null)

  /**
   * Parse the raw spec string into a resolved object
   * If there is an empty string (or no string) fallback to the default
   * If there are errors continue to show the previous valid spec
   */
  function parseInput(value?: string) {
    if (!value) return Object.assign(parsedSpec, emptySpecGenerator())

    return parse(value)
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
