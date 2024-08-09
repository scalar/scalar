<script lang="ts" setup>
import { redirectToProxy } from '@scalar/oas-utils/helpers'
import {
  type ErrorObject,
  type OpenAPI,
  dereference,
  load,
} from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import { ref, toRef } from 'vue'

import { useReactiveSpec } from '../../../src'
import type { OpenApiDocumentConfiguration } from './types'

const props = defineProps<{
  content: string | Record<string, any>
  configuration?: OpenApiDocumentConfiguration
}>()

const dereferenced = ref<OpenAPI.Document | undefined>({})
const version = ref<string | undefined>('')
const errors = ref<ErrorObject[]>([])
const content = toRef(props.content)

const { parsedSpec: transformed } = useReactiveSpec({
  proxy: () => props.configuration?.proxy ?? '',
  specConfig: () => ({
    content: content.value,
  }),
})

defineSlots<{
  default(props: {
    /** The given configuration */
    configuration: OpenApiDocumentConfiguration
    /** The specified content */
    content: typeof content.value
    /** Errors, that came up when dereferencing */
    errors: typeof errors.value
    /** OpenAPI version of the given document */
    version: typeof version.value
    /** The dereferenced OpenAPI Document */
    dereferenced: typeof dereferenced.value
    /**
     * Dereferenced, normalized and transformed OpenAPI document
     * @deprecated We’ll remove this in the future.
     */
    transformed: typeof transformed
  }): any
}>()

const loadDocument = async () => {
  const { filesystem } = await load(props.content, {
    plugins: [
      fetchUrls({
        fetch: (url) =>
          fetch(
            props.configuration?.proxy
              ? redirectToProxy(props.configuration.proxy, url)
              : url,
          ),
      }),
    ],
  })

  const {
    schema: newDereferencedDocument,
    version: newVersion,
    errors: newErrors,
  } = await dereference(filesystem)

  errors.value = newErrors ?? []
  version.value = newVersion
  dereferenced.value = newDereferencedDocument
}

loadDocument()
</script>

<template>
  <slot
    v-bind="{
      configuration,
      content,
      errors,
      version,
      dereferenced,
      transformed,
    }"></slot>
</template>
