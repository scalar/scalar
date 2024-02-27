import { useDebounceFn } from '@vueuse/core'
import { type ComputedRef, type Ref, isRef, reactive, ref, watch } from 'vue'

import { parse } from '../helpers'
import type { Spec } from '../types'

const emptySpec: Spec = {
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
}

/**
 * Dereference OpenAPI/Swagger specs
 */
export function useParser({
  input,
}: {
  input?: string | Ref<string> | ComputedRef<string>
}) {
  const parsedSpecRef = reactive<Spec>({ ...emptySpec })

  const errorRef = ref<string | null>(null)

  if (isRef(input)) {
    watch(
      input,
      useDebounceFn((value) => {
        parseInput(value)
      }),
      { immediate: true },
    )
  } else {
    parseInput(input)
  }

  async function parseInput(value?: string) {
    if (value === undefined) {
      Object.assign(parsedSpecRef, { ...emptySpec })
      return
    }

    if (value.length === 0) {
      Object.assign(parsedSpecRef, { ...emptySpec })
      return
    }

    const processedValue = value.trim()

    parse(processedValue)
      .then((schema) => {
        errorRef.value = null

        Object.assign(parsedSpecRef, {
          // Some schemas don’t have servers, make sure they are defined
          servers: [],
          ...schema,
        })
      })
      .catch((error) => {
        errorRef.value = error.toString()
      })
  }

  function overwriteParsedSpecRef(value: Spec) {
    Object.assign(parsedSpecRef, value)
  }

  return {
    parsedSpecRef,
    overwriteParsedSpecRef,
    errorRef,
  }
}
