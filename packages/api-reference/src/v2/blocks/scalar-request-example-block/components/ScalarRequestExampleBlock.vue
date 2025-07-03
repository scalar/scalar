<script lang="ts" setup>
import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { ref, watch } from 'vue'

import { getStore, type GetStoreProps } from '@/v2/blocks/helpers/get-store'

import RequestExample, { type RequestExampleProps } from './RequestExample.vue'

type Props = Pick<RequestExampleProps, 'method' | 'path'> & GetStoreProps

const { method, path, ...getStoreProps } = defineProps<Props>()

/** Either creates or grabs a global/prop store */
const store = getStore(getStoreProps)

/** The resolved operation from the workspace store */
const operation = ref<RequestExampleProps['operation'] | null>(null)

// Ensure we resolve this operation as soon as we have an active document
watch(
  () => store.workspace.activeDocument,
  async (activeDocument) => {
    if (!activeDocument) {
      return
    }

    try {
      await store.resolve(['paths', path, method])
      // TODO: remove this before merge
      const pathItem = activeDocument.paths?.[path]?.[method as 'get']
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
    :operation="operation" />
  <div
    v-else
    class="p-4 text-gray-500">
    Loading operation...
  </div>
</template>
