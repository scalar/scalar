<script lang="ts">
export type ScalarRequestExampleBlockProps = Omit<
  RequestExampleProps,
  'operation'
> &
  GetWorkspaceStoreProps

export default {}
</script>

<script lang="ts" setup>
import { isOperationDeprecated } from '@scalar/oas-utils/helpers'
import { computed, ref, watch } from 'vue'

import OperationPath from '@/components/OperationPath.vue'
import { blockStore } from '@/v2/blocks/helpers/block-store'
import { getDocumentName } from '@/v2/blocks/helpers/get-document-name'
import {
  getWorkspaceStore,
  type GetWorkspaceStoreProps,
} from '@/v2/blocks/helpers/get-workspace-store'

import RequestExample, { type RequestExampleProps } from './RequestExample.vue'

const {
  method,
  path,
  allowedClients,
  selectedClient,
  selectedServer,
  selectedContentType,
  selectedExample,
  securitySchemes,
  fallback,
  generateLabel,
  hideClientSelector,
  ...getWorkspaceStoreProps
} = defineProps<ScalarRequestExampleBlockProps>()

defineSlots<{
  header: () => unknown
  footer: () => unknown
}>()

/** Either creates or grabs a global/prop store */
const store = getWorkspaceStore(getWorkspaceStoreProps)

/** Current document */
const document = computed(() => {
  /** Grab the name of the document also used as the index */
  const documentName = getDocumentName(
    getWorkspaceStoreProps,
    store.workspace.documents,
  )

  return store.workspace.documents[documentName]
})

/** De-referenced and resolved operation from the workspace store */
const operation = ref<RequestExampleProps['operation'] | null>(null)

/** Grab the selected server, or the first one */
const server = computed(() => {
  if (selectedServer) {
    return selectedServer
  }

  if (document.value?.servers?.length) {
    return document.value.servers[0]
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
      const pathItem = document.value?.paths?.[path]?.[method]

      if (pathItem) {
        operation.value = pathItem
      }
    } catch (error) {
      console.error('Failed to resolve operation:', error)
    }
  },
  { immediate: true },
)
</script>

<template>
  <RequestExample
    v-if="operation"
    :method="method"
    :path="path"
    :operation="operation"
    :allowed-clients="allowedClients"
    :selected-client="blockStore.selectedClient ?? selectedClient"
    @update:selected-client="blockStore.selectedClient = $event"
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

    <template
      v-if="$slots.footer"
      #footer>
      <slot name="footer" />
    </template>
  </RequestExample>
</template>
