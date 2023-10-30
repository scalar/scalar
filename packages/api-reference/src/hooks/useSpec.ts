import { type ComputedRef, type Ref, isRef, ref, watch } from 'vue'

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
const getSpecContent = async ({
  url,
  content,
}: SpecConfiguration): Promise<string> => {
  if (url !== undefined && url.length > 0) {
    return await fetchSpecFromUrl(url)
  }

  if (typeof content === 'string') {
    return content
  }

  if (typeof content === 'object') {
    return JSON.stringify(content)
  }

  if (typeof content === 'function') {
    return await getSpecContent({
      content: content(),
    })
  }

  return ''
}

/**
 * Fetch the spec from the provided URL.
 */
const fetchSpecFromUrl = async (url: string): Promise<string> => {
  return await new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('The provided OpenAPI/Swagger spec URL is invalid.')
        }

        return response.text()
      })
      .then((data: string) => {
        resolve(data)
      })
      .catch((error) => {
        console.warn(
          'Could not fetch the OpenAPI/Swagger Spec file:',
          error.message,
        )

        reject(error)
      })
  })
}

/**
 * Keep the raw spec content in a ref and update it when the configuration changes.
 */
export function useSpec({
  configuration,
}: {
  configuration?:
    | SpecConfiguration
    | Ref<SpecConfiguration | undefined>
    | ComputedRef<SpecConfiguration | undefined>
}) {
  // Don’t do anything if the configuration is undefined
  if (configuration !== undefined) {
    // Watch for changes
    if (isRef(configuration)) {
      watch(
        configuration,
        async () => {
          if (configuration.value !== undefined) {
            getSpecContent(configuration.value).then((value) => {
              setRawSpecRef(value)
            })
          }
        },
        {
          immediate: true,
          deep: true,
        },
      )
    }
    // Get the content once
    else {
      getSpecContent(configuration).then((value) => {
        setRawSpecRef(value)
      })
    }
  }

  function setRawSpecRef(value: string) {
    if (value === rawSpecRef.value) {
      return
    }

    rawSpecRef.value = value
  }

  return {
    rawSpecRef,
    setRawSpecRef,
  }
}
