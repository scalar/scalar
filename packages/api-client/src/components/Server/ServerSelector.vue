<script setup lang="ts">
import { ScalarButton, ScalarListbox } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
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
    :teleport="`#${target}`"
    class="group">
    <ScalarButton
      class="bg-b-1 text-c-1 h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-t-none rounded-b-lg px-3 py-1.5 text-base font-normal whitespace-nowrap -outline-offset-1"
      variant="ghost">
      <span class="sr-only">Server:</span>
      <span class="overflow-x-auto">{{ serverUrlWithoutTrailingSlash }}</span>
      <ScalarIconCaretDown
        weight="bold"
        class="text-c-2 ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100" />
    </ScalarButton>
  </ScalarListbox>
  <div
    v-else
    class="text-c-1 flex h-auto w-full items-center gap-0.75 rounded-b-lg px-3 py-1.5 text-base leading-[20px] whitespace-nowrap">
    <span class="sr-only">Server:</span>
    <span class="overflow-x-auto">{{ serverUrlWithoutTrailingSlash }}</span>
  </div>
</template>
