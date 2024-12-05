<script lang="ts" setup>
import {
  ACTIVE_ENTITIES_SYMBOL,
  WORKSPACE_SYMBOL,
  createActiveEntitiesStore,
  createWorkspaceStore,
} from '@scalar/api-client/store'
import { redirectToProxy } from '@scalar/oas-utils/helpers'
import { type ErrorObject, dereference, load } from '@scalar/openapi-parser'
import { fetchUrls } from '@scalar/openapi-parser/plugins/fetch-urls'
import type { OpenAPI } from '@scalar/openapi-types'
import { provide, ref, toRef, watch } from 'vue'

import { useHttpClientStore, useReactiveSpec } from '../../../src'
import { ApiClientModal } from '../../features/ApiClientModal'
import type { OpenApiDocumentConfiguration } from './types'

const props = defineProps<{
  configuration?: OpenApiDocumentConfiguration
}>()

const dereferenced = ref<OpenAPI.Document | undefined>({})
const version = ref<string | undefined>('')
const errors = ref<ErrorObject[]>([])
const configuration = toRef(props.configuration)
const spec = toRef(props.configuration?.spec)

const { parsedSpec: parsedSpec } = useReactiveSpec({
  proxyUrl: () =>
    props.configuration?.proxyUrl ?? props.configuration?.proxy ?? '',
  specConfig: () => props.configuration?.spec ?? { content: '' },
})

/** Helper utility to map configuration props to the ApiReference internal state */
function mapConfigToState<K extends keyof OpenApiDocumentConfiguration>(
  key: K,
  setter: (val: NonNullable<OpenApiDocumentConfiguration[K]>) => any,
) {
  watch(
    () => configuration.value?.[key],
    (newValue) => {
      if (typeof newValue !== 'undefined') setter(newValue)
    },
    { immediate: true },
  )
}

// Hides any client snippets from the references
const { setExcludedClients, setDefaultHttpClient } = useHttpClientStore()
mapConfigToState('defaultHttpClient', setDefaultHttpClient)
mapConfigToState('hiddenClients', setExcludedClients)

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

// Create the workspace store and provide it
const workspaceStore = createWorkspaceStore({
  isReadOnly: true,
  proxyUrl: configuration.value?.proxyUrl ?? configuration.value?.proxy ?? '',
  themeId: configuration.value?.theme,
  useLocalStorage: false,
  hideClientButton: configuration.value?.hideClientButton,
})
provide(WORKSPACE_SYMBOL, workspaceStore)
workspaceStore.importSpecFile(props.configuration?.spec ?? {}, 'default', {
  shouldLoad: false,
  setCollectionSecurity: true,
  ...props.configuration,
})

// Same for the active entities store
const activeEntitiesStore = createActiveEntitiesStore(workspaceStore)
provide(ACTIVE_ENTITIES_SYMBOL, activeEntitiesStore)

const loadDocument = async () => {
  const content =
    typeof spec.value?.content === 'function'
      ? spec.value?.content()
      : spec.value?.content

  const { filesystem } = await load(spec.value?.url || content, {
    plugins: [
      fetchUrls({
        fetch: (url) =>
          fetch(
            props.configuration?.proxyUrl || props.configuration?.proxy
              ? redirectToProxy(
                  props.configuration?.proxyUrl || props.configuration?.proxy,
                  url,
                )
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
    v-if="configuration"
    :configuration="configuration" />
</template>
