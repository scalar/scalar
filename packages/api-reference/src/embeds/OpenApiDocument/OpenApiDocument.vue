<script lang="ts" setup>
import { redirectToProxy } from '@scalar/oas-utils/helpers'
import {
  type ErrorObject,
  type OpenAPI,
  dereference,
  load,
} from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import { provide, ref, toRef } from 'vue'

import { useReactiveSpec } from '../../../src'
import ApiClientModal from '../../../src/components/ApiClientModal.vue'
import { GLOBAL_SECURITY_SYMBOL } from '../../../src/helpers'
import type { OpenApiDocumentConfiguration } from './types'

const props = defineProps<{
  configuration?: OpenApiDocumentConfiguration
}>()

const dereferenced = ref<OpenAPI.Document | undefined>({})
const version = ref<string | undefined>('')
const errors = ref<ErrorObject[]>([])
const spec = toRef(props.configuration?.spec)

const { parsedSpec: parsedSpec } = useReactiveSpec({
  proxy: () => props.configuration?.proxy ?? '',
  specConfig: () => props.configuration?.spec ?? { content: '' },
})

provide(GLOBAL_SECURITY_SYMBOL, () => parsedSpec.security)

defineSlots<{
  default(props: {
    /** The given configuration */
    configuration?: OpenApiDocumentConfiguration
    /** Errors, that came up when dereferencing */
    errors: typeof errors.value
    /** OpenAPI version of the given document */
    version: typeof version.value
    /** The dereferenced OpenAPI Document */
    dereferenced: typeof dereferenced.value
    /**
     * Dereferenced, normalized and parsedSpec OpenAPI document
     * @deprecated We’ll remove this in the future.
     */
    parsedSpec: typeof parsedSpec
  }): any
}>()

const loadDocument = async () => {
  const { filesystem } = await load(spec.value?.url || spec.value?.content, {
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
      spec,
      errors,
      version,
      dereferenced,
      parsedSpec,
    }"></slot>

  <ApiClientModal
    :proxyUrl="configuration?.proxy"
    :servers="configuration?.servers"
    :spec="spec" />
</template>
