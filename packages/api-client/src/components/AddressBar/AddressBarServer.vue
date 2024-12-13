<script setup lang="ts">
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { computed, watch } from 'vue'

import AddressBarServerItem from './AddressBarServerItem.vue'

const { activeRequest, activeCollection, activeServer } = useActiveEntities()
const { isReadOnly, servers, collectionMutators, events } = useWorkspace()

const requestServerOptions = computed(() =>
  activeRequest.value?.servers?.map((serverUid: string) => ({
    id: serverUid,
    label: servers[serverUid]?.url ?? 'Unknown server',
  })),
)

const collectionServerOptions = computed(() =>
  activeCollection.value?.servers?.map((serverUid: string) => ({
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

  collectionMutators.edit(
    collection.uid,
    'selectedServerUid',
    collection.servers[0],
  )
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
  <ScalarDropdown
    class="w-max"
    teleport>
    <button
      class="font-code lg:text-sm text-xs whitespace-nowrap border border-b-3 border-solid rounded px-1.5 py-0.5 text-c-2 -outline-offset-1"
      type="button">
      <span class="sr-only">Server:</span>
      {{ serverUrlWithoutTrailingSlash }}
    </button>
    <template #items>
      <!-- Request -->
      <div
        v-if="showDropdownLabels"
        class="text-xxs text-c-2 ml-8">
        Request Servers
      </div>
      <AddressBarServerItem
        v-for="serverOption in requestServerOptions"
        :key="serverOption.id"
        :serverOption="serverOption"
        type="request" />

      <template v-if="showDropdownLabels">
        <ScalarDropdownDivider />
        <div class="text-xxs text-c-2 ml-8">Collection Servers</div>
      </template>

      <!-- Collection -->
      <AddressBarServerItem
        v-for="serverOption in collectionServerOptions"
        :key="serverOption.id"
        :serverOption="serverOption"
        type="collection" />
      <!-- Add Server -->
      <template v-if="!isReadOnly">
        <ScalarDropdownDivider />
        <ScalarDropdownItem>
          <div
            class="font-code text-xxs flex items-center gap-1.5"
            @click="handleAddServer">
            <div class="flex items-center justify-center h-4 w-4">
              <ScalarIcon
                icon="Add"
                size="sm" />
            </div>
            <span>Add Server</span>
          </div>
        </ScalarDropdownItem>
      </template>
    </template>
  </ScalarDropdown>
</template>
