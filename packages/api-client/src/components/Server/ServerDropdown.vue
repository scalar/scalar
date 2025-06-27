<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdownDivider,
  ScalarFloatingBackdrop,
  ScalarIcon,
  ScalarPopover,
} from '@scalar/components'
import type {
  Collection,
  Request as Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { computed, watch } from 'vue'

import { useLayout } from '@/hooks/useLayout'
import { useWorkspace } from '@/store/store'

import ServerDropdownItem from './ServerDropdownItem.vue'

const { target, collection, operation, server } = defineProps<{
  collection: Collection
  operation?: Operation
  server: Server | undefined
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
}>()

const { layout } = useLayout()
const { servers, collectionMutators, events, serverMutators } = useWorkspace()

const requestServerOptions = computed(() =>
  operation?.servers?.map((serverUid) => ({
    id: serverUid,
    label: servers[serverUid]?.url ?? 'Unknown server',
  })),
)

const collectionServerOptions = computed(() =>
  // Filters out servers already present in the request
  collection?.servers
    ?.filter((serverUid) => !operation?.servers?.includes(serverUid))
    .map((serverUid) => ({
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
watch([() => collection, () => operation], ([newCollection, newOperation]) => {
  if (
    !newCollection ||
    newCollection.selectedServerUid ||
    newOperation?.selectedServerUid
  ) {
    return
  }

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
  if (server?.url?.endsWith('/')) {
    return server.url.slice(0, -1)
  }
  return server?.url || ''
})

const updateServerVariable = (key: string, value: string) => {
  if (!server) {
    return
  }

  const variables = server.variables || {}
  variables[key] = { ...variables[key], default: value }

  serverMutators.edit(server.uid, 'variables', variables)
}
</script>
<template>
  <ScalarPopover
    class="max-h-[inherit] p-0 text-base"
    focus
    :offset="0"
    placement="bottom-start"
    resize
    :target="target"
    :teleport="`#${target}`">
    <ScalarButton
      class="z-context-plus hover:bg-b-2 font-code text-c-2 ml-0.75 h-auto gap-0.75 rounded border px-1.5 text-base whitespace-nowrap"
      variant="ghost">
      <template
        v-if="operation?.selectedServerUid || collection.selectedServerUid">
        <span class="sr-only">Server:</span>
        {{ serverUrlWithoutTrailingSlash }}
      </template>
      <template v-else>
        <span class="sr-only">Add Server</span>
        <ScalarIcon
          icon="Add"
          size="xs" />
      </template>
    </ScalarButton>
    <template #popover="{ close }">
      <div
        class="custom-scroll flex max-h-[inherit] flex-col gap-1 border-t p-1"
        @click="close">
        <!-- Request -->
        <ServerDropdownItem
          v-for="serverOption in requestServerOptions"
          :key="serverOption.id"
          :collection="collection"
          :operation="operation"
          :server="server"
          :serverOption="serverOption"
          type="request"
          @update:variable="updateServerVariable" />
        <template v-if="showDropdownLabels">
          <ScalarDropdownDivider />
          <div class="text-xxs text-c-2 px-2.5 py-1">Collection</div>
        </template>
        <!-- Collection -->
        <ServerDropdownItem
          v-for="serverOption in collectionServerOptions"
          :key="serverOption.id"
          :collection="collection"
          :operation="operation"
          :server="server"
          :serverOption="serverOption"
          type="collection"
          @update:variable="updateServerVariable" />
        <!-- Add Server -->
        <template v-if="layout !== 'modal'">
          <button
            class="text-xxs hover:bg-b-2 flex cursor-pointer items-center gap-1.5 rounded p-1.75"
            type="button"
            @click="handleAddServer">
            <div class="flex h-4 w-4 items-center justify-center">
              <ScalarIcon
                icon="Add"
                size="sm" />
            </div>
            <span>Add Server</span>
          </button>
        </template>
      </div>
    </template>
    <template #backdrop>
      <ScalarFloatingBackdrop
        class="-top-(--scalar-address-bar-height) rounded-lg" />
    </template>
  </ScalarPopover>
</template>
