<script setup lang="ts">
import { useLayout } from '@/hooks'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  ScalarButton,
  ScalarDropdownDivider,
  ScalarIcon,
  ScalarPopover,
} from '@scalar/components'
import { computed, watch } from 'vue'

import AddressBarServerItem from './AddressBarServerItem.vue'

const { activeRequest, activeCollection, activeServer } = useActiveEntities()
const { servers, collectionMutators, events } = useWorkspace()

const { layout } = useLayout()

const requestServerOptions = computed(() =>
  activeRequest.value?.servers?.map((serverUid: string) => ({
    id: serverUid,
    label: servers[serverUid]?.url ?? 'Unknown server',
  })),
)

const collectionServerOptions = computed(() =>
  // Filters out servers already present in the request
  activeCollection.value?.servers
    ?.filter(
      (serverUid: string) => !activeRequest.value?.servers?.includes(serverUid),
    )
    .map((serverUid: string) => ({
      id: serverUid,
      label: servers[serverUid]?.url ?? 'Unknown server',
    })),
)

/** If we have both request and collection servers we show the labels */
const showDropdownLabels = computed(
  () =>
    requestServerOptions.value?.length && collectionServerOptions.value?.length,
)

// Ensure we always have a selected server
watch([activeCollection, activeRequest], ([collection, request]) => {
  if (!collection || collection.selectedServerUid || request?.selectedServerUid)
    return

  const firstServer = collection.servers?.[0]

  if (firstServer) {
    collectionMutators.edit(collection.uid, 'selectedServerUid', firstServer)
  }
})

/** Add server */
const handleAddServer = () =>
  events.commandPalette.emit({
    commandName: 'Add Server',
  })

const serverUrlWithoutTrailingSlash = computed(() => {
  if (activeServer.value?.url?.endsWith('/')) {
    return activeServer.value.url.slice(0, -1)
  }
  return activeServer.value?.url || ''
})
</script>
<template>
  <ScalarPopover
    class="dark:bg-b-1 bg-b-2 border border-t-0 -top-1.25 min-w-full rounded-b-lg relative w-full"
    placement="top-start"
    resize
    target="address-bar">
    <ScalarButton
      class="font-code lg:text-sm text-xs whitespace-nowrap border ml-0.75 rounded px-1.5 py-0.5 h-7 text-c-2"
      variant="ghost">
      <span class="sr-only">Server:</span>
      {{ serverUrlWithoutTrailingSlash }}
    </ScalarButton>
    <template #popover="{ close }">
      <div class="menu custom-scroll flex flex-col gap-1 max-h-[300px]">
        <!-- Request -->
        <div
          v-for="serverOption in requestServerOptions"
          :key="serverOption.id"
          class="text-sm *:rounded-none first:*:rounded-l last:*:rounded-r *:h-8 *:ui-active:bg-b-2 *:flex *:items-center *:cursor-pointer *:px-1.5 text-c-2"
          @click="close">
          <AddressBarServerItem
            :serverOption="serverOption"
            type="request" />
        </div>
        <template v-if="showDropdownLabels">
          <ScalarDropdownDivider />
          <div class="text-xxs text-c-2 px-2.5 py-1">Collection</div>
        </template>
        <!-- Collection -->
        <div
          v-for="serverOption in collectionServerOptions"
          :key="serverOption.id"
          class="contents text-sm *:rounded-none first:*:rounded-l-lg last:*:rounded-r-lg *:flex text-c-2"
          @click="close">
          <AddressBarServerItem
            :serverOption="serverOption"
            type="collection" />
        </div>
        <!-- Add Server -->
        <template v-if="layout !== 'modal'">
          <div
            class="rounded text-xxs flex items-center gap-1.5 p-1.75 hover:bg-b-2 cursor-pointer"
            @click="handleAddServer">
            <div class="flex items-center justify-center h-4 w-4">
              <ScalarIcon
                icon="Add"
                size="sm" />
            </div>
            <span>Add Server</span>
          </div>
        </template>
      </div>
    </template>
  </ScalarPopover>
</template>
