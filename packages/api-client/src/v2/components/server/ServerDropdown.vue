<script lang="ts">
/**
 * ServerDropdown component
 * This component is used to display the server dropdown for the operation block
 */
export default {
  name: 'ServerDropdown',
}

export type ServerDropdownProps = {
  /** The meta information for the server */
  meta: ServerMeta
  /** List of servers that are available for the operation/document level */
  servers: ServerObject[]
  /** Currently selected server */
  server: ServerObject | null
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
  /** Client layout */
  layout: ClientLayout
}
</script>
<script setup lang="ts">
import {
  ScalarButton,
  ScalarFloatingBackdrop,
  ScalarPopover,
} from '@scalar/components'
import { ScalarIconPencilSimple, ScalarIconPlus } from '@scalar/icons'
import type {
  ApiReferenceEvents,
  ServerMeta,
} from '@scalar/workspace-store/events'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import type { ClientLayout } from '@/hooks'
import ValueEmitter from '@/v2/components/layout/ValueEmitter.vue'

import ServerDropdownItem from './ServerDropdownItem.vue'

const { target, server, servers, meta } = defineProps<ServerDropdownProps>()

const emit = defineEmits<{
  /** Update a server variable for the selected server */
  (
    e: 'update:selectedServer',
    payload: ApiReferenceEvents['server:update:selected'],
  ): void
  (
    e: 'update:variable',
    payload: ApiReferenceEvents['server:update:variables'],
  ): void
  (e: 'update:servers'): void
  /** Update the open state of the server dropdown */
  (e: 'update:open', value: boolean): void
}>()

const requestServerOptions = computed(() =>
  servers.map((s) => ({
    id: s.url,
    label: s.url ?? 'Unknown server',
  })),
)

const serverUrlWithoutTrailingSlash = computed(() => {
  if (server?.url?.endsWith('/')) {
    return server.url.slice(0, -1)
  }
  return server?.url || ''
})
</script>
<template>
  <ScalarPopover
    class="max-h-[inherit] p-0 text-base"
    focus
    :offset="0"
    placement="bottom"
    resize
    :target="target"
    :teleport="`#${target}`">
    <ScalarButton
      class="hover:bg-b-2 font-code text-c-2 ml-0.75 h-auto gap-0.75 rounded border px-1.5 text-base whitespace-nowrap"
      variant="ghost">
      <template v-if="server">
        <span class="sr-only">Server:</span>
        {{ serverUrlWithoutTrailingSlash }}
      </template>
      <template v-else>
        <span class="sr-only">Add Server</span>
        <ScalarIconPlus class="size-3" />
      </template>
    </ScalarButton>

    <template #popover="{ close }">
      <div
        class="custom-scroll flex max-h-[inherit] flex-col gap-1 p-1"
        @click="close">
        <!-- Request -->
        <ServerDropdownItem
          v-for="(serverOption, index) in requestServerOptions"
          :key="serverOption.id"
          :server="server"
          :serverOption="serverOption"
          type="request"
          @update:selectedServer="
            emit('update:selectedServer', { url: serverOption.id, meta })
          "
          @update:variable="
            (key, value) => emit('update:variable', { index, key, value, meta })
          " />

        <!-- Add Server -->
        <template v-if="layout !== 'modal'">
          <button
            class="text-xxs hover:bg-b-2 flex cursor-pointer items-center gap-1.5 rounded p-1.75"
            type="button"
            @click="emit('update:servers')">
            <div class="flex items-center justify-center">
              <ScalarIconPencilSimple class="size-4" />
            </div>
            <span>Update Servers</span>
          </button>
        </template>
      </div>
    </template>
    <template #backdrop="{ open }">
      <!-- Emit the slot value back out the parent -->
      <ValueEmitter
        :value="open"
        @change="(value) => emit('update:open', value)"
        @unmount="emit('update:open', false)" />

      <ScalarFloatingBackdrop class="inset-x-px rounded-none rounded-b-lg" />
    </template>
  </ScalarPopover>
</template>
