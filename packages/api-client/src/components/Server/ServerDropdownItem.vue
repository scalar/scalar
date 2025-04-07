<script setup lang="ts">
import { ScalarListboxCheckbox, ScalarMarkdown } from '@scalar/components'
import type {
  Collection,
  Request as Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { computed, useId } from 'vue'

import ServerVariablesForm from '@/components/Server/ServerVariablesForm.vue'
import type { ServerVariables } from '@/components/Server/types'
import { useWorkspace } from '@/store/store'

const props = defineProps<{
  collection: Collection
  operation: Operation | undefined
  server: Server | undefined
  serverOption: {
    id: Server['uid']
    label: string
  }
  type: 'collection' | 'request'
}>()

const emit = defineEmits<{
  (e: 'update:variable', key: string, value: string): void
}>()

const formId = useId()
const { collectionMutators, requestMutators, servers } = useWorkspace()

/** Update the currently selected server on the collection or request */
const updateSelectedServer = (serverUid: Server['uid'], event?: Event) => {
  if (hasVariables(serverUid)) {
    event?.stopPropagation()
  }

  // Handle selected server deselection
  if (isSelectedServer.value) {
    // Clear selected server if selected
    if (props.operation?.servers?.length) {
      requestMutators.edit(props.operation.uid, 'selectedServerUid', null)
    }
    if (props.type === 'collection') {
      collectionMutators.edit(
        props.collection.uid,
        'selectedServerUid',
        undefined,
      )
    } else if (props.type === 'request' && props.operation) {
      requestMutators.edit(props.operation.uid, 'selectedServerUid', null)
    }
    return
  }

  // Set selected server on Collection
  if (props.type === 'collection' && props.collection) {
    // Clear the selected server on the request so that the collection can be updated
    if (props.operation?.servers?.length) {
      requestMutators.edit(props.operation.uid, 'selectedServerUid', null)
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
const isSelectedServer = computed(() => {
  if (props.type === 'collection') {
    // Check selected collection unless operation level server is selected
    return (
      props.collection.selectedServerUid === props.serverOption.id &&
      !props.operation?.selectedServerUid
    )
  }

  if (props.type === 'request' && props.operation) {
    return props.operation.selectedServerUid === props.serverOption.id
  }

  return false
})

const hasVariables = (serverUid: string) => {
  if (!serverUid) {
    return false
  }

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
    class="group/item flex min-h-fit flex-col rounded border"
    :class="{ 'border-transparent': !isSelectedServer }">
    <button
      v-bind="isExpanded ? { 'aria-controls': formId } : {}"
      :aria-expanded="isExpanded"
      class="flex min-h-8 cursor-pointer items-center gap-1.5 rounded px-1.5"
      :class="isSelectedServer ? 'text-c-1 bg-b-2' : 'hover:bg-b-2'"
      type="button"
      @click="(e) => updateSelectedServer(serverOption.id, e)">
      <ScalarListboxCheckbox :selected="isSelectedServer" />
      <span class="overflow-hidden text-ellipsis whitespace-nowrap">
        {{ serverOption.label }}
      </span>
    </button>
    <!-- Server variables -->
    <div
      v-if="isExpanded"
      :id="formId"
      class="bg-b-2 divide divide-y rounded-b border-t *:pl-4"
      @click.stop>
      <ServerVariablesForm
        :variables="server?.variables as ServerVariables"
        @update:variable="updateServerVariable" />
      <!-- Description -->
      <div v-if="server?.description">
        <div class="description text-c-3 px-3 py-1.5">
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
