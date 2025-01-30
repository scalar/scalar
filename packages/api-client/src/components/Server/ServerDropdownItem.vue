<script setup lang="ts">
import ServerVariablesForm from '@/components/Server/ServerVariablesForm.vue'
import { useWorkspace } from '@/store/store'
import { ScalarListboxCheckbox, ScalarMarkdown } from '@scalar/components'
import type {
  Collection,
  Request as Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { computed, useId } from 'vue'

const props = defineProps<{
  collection: Collection
  operation: Operation | undefined
  server: Server | undefined
  serverOption: { id: string; label: string }
  type: 'collection' | 'request'
  layout: 'client' | 'reference'
}>()

const emit = defineEmits<{
  (e: 'update:variable', key: string, value: string): void
}>()

const formId = useId()

const { collectionMutators, requestMutators, servers } = useWorkspace()

/** Update the currently selected server on the collection or request */
const updateSelectedServer = (serverUid: string, event?: Event) => {
  if (hasVariables(serverUid) && props.layout !== 'reference') {
    event?.stopPropagation()
  }

  // Set selected server on Collection
  if (props.type === 'collection' && props.collection) {
    // Clear the selected server on the request so that the collection can be updated
    if (props.operation?.servers?.length) {
      requestMutators.edit(props.operation.uid, 'selectedServerUid', '')
    }
    collectionMutators.edit(
      props.collection.uid,
      'selectedServerUid',
      serverUid,
    )
  }
  // Set on the operation
  else if (props.type === 'request' && props.operation) {
    requestMutators.edit(props.operation.uid, 'selectedServerUid', serverUid)
  }
}

/** Set server checkbox in the dropdown */
const isSelectedServer = computed(
  () => props.server?.uid === props.serverOption.id,
)

const hasVariables = (serverUid: string) => {
  if (!serverUid) return false

  const server = servers[serverUid]

  return Object.keys(server?.variables ?? {}).length > 0
}

const isExpanded = computed(
  () => isSelectedServer.value && hasVariables(props.server?.uid ?? ''),
)

const updateServerVariable = (key: string, value: string) => {
  emit('update:variable', key, value)
}
</script>
<template>
  <div
    class="min-h-fit rounded flex flex-col border group/item"
    :class="{ 'border-transparent': !isSelectedServer }">
    <button
      :aria-controls="isExpanded ? formId : undefined"
      :aria-expanded="isExpanded"
      class="cursor-pointer rounded flex items-center gap-1.5 min-h-8 px-1.5"
      :class="isSelectedServer ? 'text-c-1 bg-b-2' : 'hover:bg-b-2'"
      type="button"
      @click="(e) => updateSelectedServer(serverOption.id, e)">
      <ScalarListboxCheckbox :selected="isSelectedServer" />
      <span class="whitespace-nowrap text-ellipsis overflow-hidden">
        {{ serverOption.label }}
      </span>
    </button>
    <!-- Server variables -->
    <div
      v-if="isExpanded && props.layout !== 'reference'"
      :id="formId"
      class="bg-b-2 border-t divide divide-y *:pl-4 rounded-b"
      @click.stop>
      <ServerVariablesForm
        :variables="server?.variables"
        @update:variable="updateServerVariable" />
      <!-- Description -->
      <div v-if="server?.description">
        <div class="description px-3 py-1.5 text-c-3">
          <ScalarMarkdown :value="server.description" />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.description :deep(.markdown) {
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color--1);
  padding: 0 0;
  display: block;
}
.description :deep(.markdown > *:first-child) {
  margin-top: 0;
}
</style>
