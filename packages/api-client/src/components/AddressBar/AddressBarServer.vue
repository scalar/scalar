<script setup lang="ts">
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { ScalarDropdownDivider, ScalarIcon } from '@scalar/components'
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
  <Listbox v-slot="{ open }">
    <ListboxButton
      class="menu font-code lg:text-sm text-xs whitespace-nowrap border ml-0.75 rounded px-1.5 py-0.5 text-c-2"
      type="button">
      <span class="sr-only">Server:</span>
      {{ serverUrlWithoutTrailingSlash }}
    </ListboxButton>

    <!-- Menu shadow and placement-->
    <div
      :class="[
        'absolute left-0 top-[calc(100%-0.5px)] w-full rounded-lg before:pointer-events-none before:absolute before:left-0 before:-top-8 before:h-[calc(100%+32px)] before:w-full before:rounded-lg z-context',
        { 'before:shadow-border-1/2 open': open },
      ]">
      <ListboxOptions
        class="addressbar-bg-states border-t custom-scroll flex flex-col gap-1 max-h-[300px] p-0.75">
        <!-- Request -->
        <ListboxOption
          v-for="serverOption in requestServerOptions"
          :key="serverOption.id"
          class="contents text-sm *:rounded-none first:*:rounded-l last:*:rounded-r *:h-8 *:ui-active:bg-b-2 *:flex *:items-center *:cursor-pointer *:px-1.5 text-c-2">
          <AddressBarServerItem
            :serverOption="serverOption"
            type="request" />
        </ListboxOption>
        <template v-if="showDropdownLabels">
          <ScalarDropdownDivider />
          <div class="text-xxs text-c-2 px-2.5 py-1">Collection</div>
        </template>
        <!-- Collection -->
        <ListboxOption
          v-for="serverOption in collectionServerOptions"
          :key="serverOption.id"
          class="contents text-sm *:rounded-none first:*:rounded-l-lg last:*:rounded-r-lg *:flex text-c-2">
          <AddressBarServerItem
            :serverOption="serverOption"
            type="collection" />
        </ListboxOption>
        <!-- Add Server -->
        <template v-if="!isReadOnly">
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
      </ListboxOptions>

      <!-- Backdrop for the dropdown -->
      <div class="absolute inset-0 -z-1 rounded bg-b-1 brightness-lifted" />
    </div>
  </Listbox>
</template>

<style scoped>
.addressbar-bg-states:has(.cm-focused) .codemirror-bg-switcher {
  --scalar-background-1: var(--scalar-background-1);
}
.addressbar-bg-states {
  background: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
}
.addressbar-bg-states:has(.cm-focused) {
  background: var(--scalar-background-1);
  border-color: var(--scalar-border-color);
  outline: 1px solid var(--scalar-color-accent);
}
</style>
