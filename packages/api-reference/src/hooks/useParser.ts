import { parse } from '@scalar/swagger-parser'
import { type ComputedRef, type Ref, isRef, reactive, ref, watch } from 'vue'

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
  servers: [],
  components: {
    schemas: {},
    securitySchemes: {},
  },
  tags: [],
}

/**
 * Dereference OpenAPI/Swagger specs
 */
export function useParser({
  input,
}: {
  input: string | Ref<string> | ComputedRef<string>
}) {
  const parsedSpecRef = reactive<Spec>(emptySpec)

  const errorRef = ref<string | null>(null)

  if (isRef(input)) {
    watch(input, parseInput, { immediate: true })
  } else {
    parseInput(input)
  }

  async function parseInput(value?: string) {
    if (value === undefined) {
      return
    }

    try {
      parse(value)
        .then((spec) => {
          errorRef.value = null

          Object.assign(parsedSpecRef, {
            // Some specs don’t have servers or tags, make sure they are defined
            servers: [],
            ...spec,
          })
        })
        .catch((error) => {
          errorRef.value = error.toString()
        })
    } catch (error) {
      console.error(error)
    }
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
