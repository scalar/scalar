<script setup lang="ts">
import ServerVariablesForm from '@/components/Server/ServerVariablesForm.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarIcon, ScalarMarkdown } from '@scalar/components'
import { computed } from 'vue'

const props = defineProps<{
  serverOption: { id: string; label: string }
  type: 'collection' | 'request'
}>()

const { activeCollection, activeRequest, activeServer } = useActiveEntities()
const { collectionMutators, requestMutators, serverMutators, servers } =
  useWorkspace()

/** Update the currently selected server on the collection or request */
const updateSelectedServer = (serverUid: string) => {
  if (props.type === 'collection' && activeCollection.value) {
    // Clear the selected server on the request so that the collection can be updated
    if (activeRequest.value?.servers?.length) {
      activeRequest.value.selectedServerUid = ''
    }
    collectionMutators.edit(
      activeCollection.value.uid,
      'selectedServerUid',
      serverUid,
    )
  } else if (props.type === 'request' && activeRequest.value) {
    requestMutators.edit(
      activeRequest.value.uid,
      'selectedServerUid',
      serverUid,
    )
  }
}

/** Set server checkbox in the dropdown */
const isSelectedServer = (serverId: string) =>
  activeServer.value?.uid === serverId

/** Prevents menu from closing if the server has variables */
const handleClick = (event: Event, serverId: string) => {
  const hasVariables =
    servers[serverId]?.variables &&
    Object.keys(servers[serverId].variables).length > 0

  if (hasVariables) {
    event.stopPropagation()
  }
  updateSelectedServer(serverId)
}

const updateServerVariable = (key: string, value: string) => {
  if (!activeServer.value) return

  const variables = activeServer.value.variables || {}
  variables[key] = { ...variables[key], default: value }

  serverMutators.edit(activeServer.value.uid, 'variables', variables)
}
</script>

<template>
  <div
    class="flex flex-col group/item whitespace-nowrap text-ellipsis overflow-hidden w-full"
    :class="
      isSelectedServer(serverOption.id) ? 'border' : 'border border-transparent'
    "
    @click="handleClick($event, serverOption.id)">
    <div
      class="cursor-pointer flex items-center gap-1.5 min-h-8 px-1.5"
      :class="isSelectedServer(serverOption.id) ? 'bg-b-1' : 'hover:bg-b-2'">
      <div
        class="flex size-4 items-center justify-center p-0.75 text-b-1 rounded-full"
        :class="
          isSelectedServer(serverOption.id)
            ? 'bg-c-accent text-b-1'
            : 'shadow-border text-transparent'
        ">
        <ScalarIcon
          icon="Checkmark"
          size="xs"
          thickness="2.5" />
      </div>
      <span class="whitespace-nowrap text-ellipsis overflow-hidden">
        {{ serverOption.label }}
      </span>
    </div>

    <!-- Server variables -->
    <div
      v-if="isSelectedServer(serverOption.id) && activeServer?.variables"
      class="bg-b-1 border-t divide divide-y *:pl-4">
      <ServerVariablesForm
        :variables="activeServer?.variables"
        @update:variable="updateServerVariable" />
      <!-- Description -->
      <div v-if="activeServer?.description">
        <div class="description px-3 py-1.5 text-c-3">
          <ScalarMarkdown :value="activeServer.description" />
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
