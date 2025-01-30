<script setup lang="ts">
import { useLayout } from '@/hooks/useLayout'
import { useWorkspace } from '@/store/store'
import {
  ScalarButton,
  ScalarDropdownDivider,
  ScalarFloatingBackdrop,
  ScalarIcon,
  ScalarPopover,
  cva,
  cx,
} from '@scalar/components'
import type {
  Collection,
  Request as Operation,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { computed, watch } from 'vue'

import ServerDropdownItem from './ServerDropdownItem.vue'

const { target, collection, layout, operation, server } = defineProps<{
  collection: Collection
  operation?: Operation
  server: Server | undefined
  layout: 'client' | 'reference'
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
}>()

const { layout: clientLayout } = useLayout()
const { servers, collectionMutators, events, serverMutators } = useWorkspace()

const requestServerOptions = computed(() =>
  operation?.servers?.map((serverUid: string) => ({
    id: serverUid,
    label: servers[serverUid]?.url ?? 'Unknown server',
  })),
)

const collectionServerOptions = computed(() =>
  // Filters out servers already present in the request
  collection?.servers
    ?.filter((serverUid: string) => !operation?.servers?.includes(serverUid))
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
watch([() => collection, () => operation], ([newCollection, newOperation]) => {
  if (
    !newCollection ||
    newCollection.selectedServerUid ||
    newOperation?.selectedServerUid
  )
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
  if (server?.url?.endsWith('/')) {
    return server.url.slice(0, -1)
  }
  return server?.url || ''
})

const updateServerVariable = (key: string, value: string) => {
  if (!server) return

  const variables = server.variables || {}
  variables[key] = { ...variables[key], default: value }

  serverMutators.edit(server.uid, 'variables', variables)
}

// Define variants for the button
const buttonVariants = cva({
  base: 'gap-0.75 z-context-plus lg:text-sm text-xs whitespace-nowrap px-1.5 h-6.5',
  variants: {
    reference: {
      true: '!font-normal justify-start px-3 py-1.5 rounded-b-lg text-c-1 w-full',
      false: 'border hover:bg-b-2 font-code ml-0.75 rounded text-c-2',
    },
  },
})
</script>
<template>
  <ScalarPopover
    class="max-h-[inherit] p-0 text-sm"
    :offset="layout === 'reference' ? 6 : 0"
    placement="bottom-start"
    resize
    :target="target"
    :teleport="`#${target}`">
    <ScalarButton
      :class="cx(buttonVariants({ reference: layout === 'reference' }))"
      variant="ghost">
      <span class="sr-only">Server:</span>
      {{ serverUrlWithoutTrailingSlash }}

      <ScalarIcon
        v-if="layout === 'reference'"
        class="text-c-2"
        icon="ChevronDown"
        size="sm" />
    </ScalarButton>
    <template #popover="{ close }">
      <div
        class="custom-scroll flex p-1 flex-col gap-1 max-h-[inherit]"
        :class="layout !== 'reference' && 'border-t'"
        @click="close">
        <!-- Request -->
        <ServerDropdownItem
          v-for="serverOption in requestServerOptions"
          :key="serverOption.id"
          :collection="collection"
          :layout="layout"
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
          :layout="layout"
          :operation="operation"
          :server="server"
          :serverOption="serverOption"
          type="collection"
          @update:variable="updateServerVariable" />
        <!-- Add Server -->
        <template v-if="clientLayout !== 'modal'">
          <button
            class="rounded text-xxs flex items-center gap-1.5 p-1.75 hover:bg-b-2 cursor-pointer"
            type="button"
            @click="handleAddServer">
            <div class="flex items-center justify-center h-4 w-4">
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
        class="-top-[--scalar-address-bar-height] rounded-lg" />
    </template>
  </ScalarPopover>
</template>
