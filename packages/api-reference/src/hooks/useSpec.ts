import { fetchSpecFromUrl } from '@scalar/swagger-editor'
import { type ComputedRef, type Ref, isRef, ref, watch } from 'vue'

import { isValidUrl } from '../helpers'
import type { SpecConfiguration } from '../types'

/**
 * The raw (= including references) spec content.
 */
const rawSpecRef = ref('')

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
  if (url !== undefined && url.length > 0) {
    if (!isValidUrl(url)) {
      // if the url is not valid, we can assume its a path
      // and if it's a path we don't need to fetch from a proxy
      // since it's served with the file
      return await fetchSpecFromUrl(url)
    }
    return await fetchSpecFromUrl(url, proxy)
  }

  if (typeof content === 'string') {
    return content
  }

  if (typeof content === 'object') {
    return JSON.stringify(content)
  }

  if (typeof content === 'function') {
    return await getSpecContent(
      {
        content: content(),
      },
      proxy,
    )
  }

  return undefined
}

/**
 * Keep the raw spec content in a ref and update it when the configuration changes.
 */
export function useSpec({
  configuration,
  proxy,
}: {
  configuration?:
    | SpecConfiguration
    | Ref<SpecConfiguration | undefined>
    | ComputedRef<SpecConfiguration | undefined>
  proxy?: string
}) {
  // Don’t do anything if the configuration is undefined
  if (configuration !== undefined) {
    // Watch for changes
    if (isRef(configuration)) {
      watch(
        configuration,
        async () => {
          setConfiguration(configuration.value)
        },
        {
          immediate: true,
          deep: true,
        },
      )
    }
    // Get the content once
    else {
      getSpecContent(configuration, proxy).then((value) => {
        if (value !== undefined) {
          setRawSpecRef(value)
        }
      })
    }
  }

  // Manually update the spec configuration
  function setConfiguration(newConfiguration: SpecConfiguration | undefined) {
    if (newConfiguration !== undefined) {
      getSpecContent(newConfiguration, proxy).then((value) => {
        if (value !== undefined) {
          setRawSpecRef(value)
        }
      })
    }
  }

  // Manually updating the unparsed specification
  function setRawSpecRef(value: string) {
    if (value === rawSpecRef.value) {
      return
    }

    rawSpecRef.value = value
  }

  return {
    rawSpecRef,
    setRawSpecRef,
    setConfiguration,
  }
}
