<script setup lang="ts">
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import type { Collection, Server } from '@scalar/oas-utils/entities/spec'
import { computed, watch } from 'vue'

import { useWorkspace } from '@/store/store'

type ServerOption = {
  id: Server['uid']
  label: string
}

const { target, collection, server } = defineProps<{
  /** The collection */
  collection: Collection
  /** The selected server */
  server: Server | undefined
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
}>()

const emit = defineEmits<{
  (e: 'updateServer', server: string): void
}>()

const { servers, collectionMutators } = useWorkspace()

const serverOptions = computed<ServerOption[]>(() =>
  collection?.servers.map((serverUid) => ({
    id: serverUid,
    label: servers[serverUid]?.url ?? 'Unknown server',
  })),
)

const selectedServer = computed<ServerOption | undefined>({
  get: () =>
    server
      ? serverOptions.value.find((option) => option.id === server.uid)
      : undefined,
  set: (option) => {
    if (!option) {
      return
    }
    collectionMutators.edit(
      collection.uid,
      'selectedServerUid',
      option.id as Server['uid'],
    )
    const serverUrl = servers[option.id]?.url
    if (serverUrl) {
      emit('updateServer', serverUrl)
    }
  },
})

// Ensure we always have a selected server
watch(
  () => collection,
  (newCollection) => {
    if (!newCollection || newCollection.selectedServerUid) {
      return
    }

    const firstServer = collection.servers?.[0]

    if (firstServer) {
      collectionMutators.edit(collection.uid, 'selectedServerUid', firstServer)
      if (servers[firstServer]?.url) {
        emit('updateServer', servers[firstServer].url)
      }
    }
  },
)

const serverUrlWithoutTrailingSlash = computed(() => {
  if (server?.url?.endsWith('/')) {
    return server.url.slice(0, -1)
  }
  return server?.url || ''
})
</script>
<template>
  <ScalarListbox
    v-if="serverOptions.length > 1"
    v-model="selectedServer"
    :options="serverOptions"
    placement="bottom-start"
    resize
    :target="target"
    :teleport="`#${target}`">
    <ScalarButton
      class="gap-0.75 text-c-1 h-6.5 w-full justify-start overflow-x-auto whitespace-nowrap rounded-b-lg px-3 py-1.5 text-xs font-normal -outline-offset-1 lg:text-sm"
      variant="ghost">
      <span class="sr-only">Server:</span>
      <span class="overflow-x-auto">{{ serverUrlWithoutTrailingSlash }}</span>
      <ScalarIcon
        class="text-c-2"
        icon="ChevronDown"
        size="sm" />
    </ScalarButton>
  </ScalarListbox>
  <div
    v-else
    class="gap-0.75 text-c-1 h-6.5 flex w-full items-center whitespace-nowrap rounded-b-lg px-3 py-1.5 text-xs lg:text-sm">
    <span class="sr-only">Server:</span>
    <span class="overflow-x-auto">{{ serverUrlWithoutTrailingSlash }}</span>
  </div>
</template>
