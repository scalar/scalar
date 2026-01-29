<script setup lang="ts">
import {
  ScalarButton,
  ScalarFloatingBackdrop,
  ScalarPopover,
} from '@scalar/components'
import { ScalarIconPencilSimple, ScalarIconPlus } from '@scalar/icons'
import type { ApiReferenceEvents } from '@scalar/workspace-store/events'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import type { ClientLayout } from '@/hooks'
import ValueEmitter from '@/v2/components/layout/ValueEmitter.vue'

import ServerDropdownItem from './ServerDropdownItem.vue'

const { target, server, servers } = defineProps<{
  /** List of servers that are available for the operation/document level */
  servers: ServerObject[]
  /** Currently selected server */
  server: ServerObject | null
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
  /** Client layout */
  layout: ClientLayout
}>()

const emits = defineEmits<{
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
            emits('update:selectedServer', { url: serverOption.id })
          "
          @update:variable="
            (key, value) => emits('update:variable', { index, key, value })
          " />

        <!-- Add Server -->
        <template v-if="layout !== 'modal'">
          <button
            class="text-xxs hover:bg-b-2 flex cursor-pointer items-center gap-1.5 rounded p-1.75"
            type="button"
            @click="emits('update:servers')">
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
        @change="(value) => emits('update:open', value)"
        @unmount="emits('update:open', false)" />

      <ScalarFloatingBackdrop class="inset-x-px rounded-none rounded-b-lg" />
    </template>
  </ScalarPopover>
</template>
