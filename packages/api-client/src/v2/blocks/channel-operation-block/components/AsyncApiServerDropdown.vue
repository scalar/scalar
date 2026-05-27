<script lang="ts">
export default {
  name: 'AsyncApiServerDropdown',
}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarFloatingBackdrop } from '@scalar/components/floating'
import { ScalarListboxCheckbox } from '@scalar/components/listbox'
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarPopover } from '@scalar/components/popover'
import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import { computed } from 'vue'

import { stripTrailingSlash } from '@/v2/blocks/channel-operation-block/helpers/connection-bar-url'
import ValueEmitter from '@/v2/components/layout/ValueEmitter.vue'

const { target, servers, selectedServer } = defineProps<{
  /** Popover target element id */
  target: string
  /** Available WebSocket servers */
  servers: AsyncApiServerEntry[]
  /** Currently selected server entry */
  selectedServer: AsyncApiServerEntry | null
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'select:server', serverName: string): void
}>()

const serverUrlWithoutTrailingSlash = computed(() => {
  const url = selectedServer?.url ?? ''
  return url ? stripTrailingSlash(url) : ''
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
      class="hover:bg-b-2 font-code text-c-2 relative z-10 flex h-full max-w-[min(50vw,280px)] shrink-0 items-center gap-0.75 truncate rounded border px-1.5 py-0 text-base leading-none whitespace-nowrap"
      variant="ghost">
      <template v-if="selectedServer">
        <span class="sr-only">Server:</span>
        <span class="truncate">{{ serverUrlWithoutTrailingSlash }}</span>
      </template>
      <template v-else>
        <span class="sr-only">Select server</span>
        Select server
      </template>
    </ScalarButton>

    <template #popover="{ close }">
      <div
        class="custom-scroll flex max-h-[inherit] flex-col gap-1 p-1"
        @click="close">
        <button
          v-for="entry in servers"
          :key="entry.name"
          class="flex min-h-8 cursor-pointer items-center gap-1.5 rounded px-1.5"
          :class="
            entry.name === selectedServer?.name
              ? 'text-c-1 bg-b-2'
              : 'hover:bg-b-2'
          "
          type="button"
          @click="emit('select:server', entry.name)">
          <ScalarListboxCheckbox
            :selected="entry.name === selectedServer?.name" />
          <span class="flex min-w-0 flex-col text-left">
            <span
              class="overflow-hidden font-medium text-ellipsis whitespace-nowrap">
              {{ entry.title ?? entry.name }}
            </span>
            <span
              class="text-c-3 overflow-hidden text-xs text-ellipsis whitespace-nowrap">
              {{ entry.connectionUrl ?? entry.url }}
            </span>
          </span>
        </button>
        <div
          v-if="selectedServer?.server.description"
          class="text-c-3 border-t px-2 py-1.5 text-xs">
          <ScalarMarkdown :value="selectedServer.server.description" />
        </div>
      </div>
    </template>

    <template #backdrop="{ open }">
      <ValueEmitter
        :value="open"
        @change="(value) => emit('update:open', value)"
        @unmount="emit('update:open', false)" />

      <ScalarFloatingBackdrop class="inset-x-px rounded-none rounded-b-lg" />
    </template>
  </ScalarPopover>
</template>
