<script lang="ts" setup>
import { isOperationDeprecated } from '@scalar/oas-utils/helpers'
import { computed, ref, watch } from 'vue'

import OperationPath from '@/components/OperationPath.vue'
import { getStore, type GetStoreProps } from '@/v2/blocks/helpers/get-store'

import RequestExample, { type RequestExampleProps } from './RequestExample.vue'

type Props = Omit<RequestExampleProps, 'operation'> & GetStoreProps

const {
  method,
  path,
  allowedClients,
  selectedClient,
  selectedServer,
  selectedContentType,
  selectedExample,
  fallback,
  generateLabel,
  hideClientSelector,
  ...getStoreProps
} = defineProps<Props>()

defineSlots<{
  header: () => unknown
  footer: () => unknown
}>()

/** Either creates or grabs a global/prop store */
const store = getStore(getStoreProps)

/** The resolved operation from the workspace store */
const operation = ref<RequestExampleProps['operation'] | null>(null)

/** Grab the selected server, or the first one */
const server = computed(() => {
  if (selectedServer) {
    return selectedServer
  }

  if (store.workspace.activeDocument?.servers?.length) {
    return store.workspace.activeDocument.servers[0]
  }

  // This will trigger our logic to create a proper URL
  return { url: '/' }
})

// Ensure we resolve this operation as soon as we have an active document
watch(
  () => store.workspace.activeDocument,
  async (activeDocument) => {
    if (!activeDocument) {
      return
    }

    try {
      await store.resolve(['paths', path, method])
      const pathItem = activeDocument.paths?.[path]?.[method]

      if (pathItem) {
        operation.value = pathItem
      }
    } catch (error) {
      console.error('Failed to resolve operation:', error)
    }
  },
)
</script>

<template>
  <RequestExample
    v-if="operation"
    :method="method"
    :path="path"
    :operation="operation"
    :allowed-clients="allowedClients"
    :selected-client="selectedClient"
    :selected-server="server"
    :selected-content-type="selectedContentType"
    :selected-example="selectedExample"
    :security-schemes="securitySchemes"
    :fallback="fallback"
    :generate-label="generateLabel"
    :hide-client-selector="hideClientSelector">
    <template #header>
      <slot name="header">
        <OperationPath
          class="font-code text-c-2 [&_em]:text-c-1 [&_em]:not-italic"
          :deprecated="isOperationDeprecated(operation)"
          :path="path" />
      </slot>
    </template>

    <template #footer>
      <slot name="footer" />
    </template>
  </RequestExample>
</template>
