import { type ComputedRef, type Ref, isRef, ref, watch } from 'vue'

import type { SpecConfiguration } from '../types'

// TODO: Trigger swagger parser
// TODO: Deal with Preparsed content
// TODO: Update CodeMirror when the config changed

const rawSpecRef = ref('')

const getSpecContent = async (
  configuration: SpecConfiguration,
): Promise<string> => {
  if (configuration.url !== undefined && configuration.url.length > 0) {
    return await fetchSpecFromUrl(configuration.url)
  }

  if (typeof configuration.content === 'string') {
    return configuration.content
  }

  if (typeof configuration.content === 'object') {
    return JSON.stringify(configuration.content)
  }

  if (typeof configuration.content === 'function') {
    return await getSpecContent({
      content: configuration.content(),
    })
  }

  return ''
}

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

        reject('')
      })
  })
}

export function useSpec({
  configuration,
}: {
  configuration?:
    | SpecConfiguration
    | Ref<SpecConfiguration>
    | ComputedRef<SpecConfiguration>
}) {
  // Don’t do anything if the configuration is undefined
  if (configuration !== undefined) {
    // Watch for changes
    if (isRef(configuration)) {
      watch(
        configuration,
        async () => {
          getSpecContent(configuration.value).then((value) => {
            setRawSpecRef(value)
          })
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
    rawSpecRef.value = value
  }

  return {
    rawSpecRef,
    setRawSpecRef,
  }
}
