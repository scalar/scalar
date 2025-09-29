<script setup lang="ts">
import {
  ScalarButton,
  ScalarFloatingBackdrop,
  ScalarIcon,
  ScalarPopover,
} from '@scalar/components'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import type { ClientLayout } from '@/hooks'

import ServerDropdownItem from './ServerDropdownItem.vue'

const { target, server, servers } = defineProps<{
  /** List of servers that are available for the operation/document level */
  servers: ServerObject[]
  /** Currently selected server */
  server: ServerObject | undefined
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
  /** Client layout */
  layout: ClientLayout
}>()

const emits = defineEmits<{
  /** Update a server variable for the selected server */
  (e: 'update:selectedServer', payload: { id: string }): void
  (e: 'update:variable', payload: { key: string; value: string }): void
  (e: 'addServer'): void
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
    placement="bottom-start"
    resize
    :target="target"
    :teleport="`#${target}`">
    <ScalarButton
      class="z-context-plus hover:bg-b-2 font-code text-c-2 ml-0.75 h-auto gap-0.75 rounded border px-1.5 text-base whitespace-nowrap"
      variant="ghost">
      <template v-if="server">
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
          :server="server"
          :serverOption="serverOption"
          type="request"
          @update:selectedServer="emits('update:selectedServer', $event)"
          @update:variable="
            (key, value) => emits('update:variable', { key, value })
          " />
        <!-- Add Server -->
        <template v-if="layout !== 'modal'">
          <button
            class="text-xxs hover:bg-b-2 flex cursor-pointer items-center gap-1.5 rounded p-1.75"
            type="button"
            @click="emits('addServer')">
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
