<script lang="ts">
export default {
  name: 'AsyncApiServerDropdown',
}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarFloatingBackdrop } from '@scalar/components/floating'
import { ScalarPopover } from '@scalar/components/popover'
import { ScalarListboxCheckbox } from '@scalar/components/listbox'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import { computed } from 'vue'

import { stripTrailingSlash } from '@/v2/blocks/channel-operation-block/helpers/connection-bar-url'

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
    v-if="servers.length"
    class="max-h-[inherit] p-0 text-base"
    focus
    :offset="0"
    placement="bottom"
    resize
    :target="target"
    :teleport="`#${target}`"
    @update:open="(value: boolean) => emit('update:open', value)">
    <ScalarButton
      class="hover:bg-b-2 font-code text-c-2 h-auto gap-0.75 rounded border px-1.5 text-base whitespace-nowrap @3xl:ml-0.75"
      variant="ghost">
      <template v-if="selectedServer">
        <span class="sr-only">Server:</span>
        {{ serverUrlWithoutTrailingSlash }}
      </template>
      <template v-else>
        <span class="sr-only">Select server</span>
        Select server
      </template>
    </ScalarButton>
    <template #content>
      <ScalarFloatingBackdrop class="flex flex-col gap-1 p-1">
        <button
          v-for="entry in servers"
          :key="entry.name"
          class="flex min-h-8 cursor-pointer items-center gap-1.5 rounded px-1.5"
          :class="entry.name === selectedServer?.name ? 'text-c-1 bg-b-2' : 'hover:bg-b-2'"
          type="button"
          @click="emit('select:server', entry.name)">
          <ScalarListboxCheckbox :selected="entry.name === selectedServer?.name" />
          <span class="flex min-w-0 flex-col text-left">
            <span class="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
              {{ entry.title ?? entry.name }}
            </span>
            <span class="text-c-3 overflow-hidden text-ellipsis whitespace-nowrap text-xs">
              {{ entry.connectionUrl ?? entry.url }}
            </span>
          </span>
        </button>
        <div
          v-if="selectedServer?.server.description"
          class="text-c-3 border-t px-2 py-1.5 text-xs">
          <ScalarMarkdown :value="selectedServer.server.description" />
        </div>
      </ScalarFloatingBackdrop>
    </template>
  </ScalarPopover>
</template>
