<script setup lang="ts">
import { ScalarButton, ScalarListbox } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

const { target, servers, selectedServer } = defineProps<{
  /** The selected server URL */
  selectedServer: ServerObject | null
  /** Available servers */
  servers: ServerObject[]
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
}>()

const emit = defineEmits<{
  /** Emitted when the selected server changes */
  (e: 'update:modelValue', value: string): void
}>()

const serverOptions = computed(() =>
  servers.map((server) => ({
    id: server.url,
    label: server.url,
  })),
)

const serverUrlWithoutTrailingSlash = computed(
  () => selectedServer?.url?.replace(/\/$/, '') || '',
)

const selectedServerOption = computed(() =>
  serverOptions.value.find((opt) => opt.id === selectedServer?.url),
)

// For testing
defineExpose({
  servers,
  serverUrlWithoutTrailingSlash,
  serverOptions,
  selectedServer,
})
</script>
<template>
  <ScalarListbox
    v-if="serverOptions.length > 1"
    ref="elem"
    class="group"
    :modelValue="selectedServerOption"
    :options="serverOptions"
    placement="bottom-start"
    resize
    :target="target"
    @update:modelValue="(e) => emit('update:modelValue', e.id)">
    <ScalarButton
      class="bg-b-1 text-c-1 h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-t-none rounded-b-lg px-3 py-1.5 text-base font-normal whitespace-nowrap -outline-offset-1"
      variant="ghost">
      <span class="sr-only">Server:</span>
      <span class="overflow-x-auto">{{
        serverUrlWithoutTrailingSlash || 'Select a server'
      }}</span>
      <ScalarIconCaretDown
        class="text-c-2 ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100"
        weight="bold" />
    </ScalarButton>
  </ScalarListbox>
  <div
    v-else
    class="text-c-1 flex h-auto w-full items-center gap-0.75 rounded-b-lg px-3 py-1.5 text-base leading-[20px] whitespace-nowrap">
    <span class="sr-only">Server:</span>
    <span class="overflow-x-auto">{{ serverUrlWithoutTrailingSlash }}</span>
  </div>
</template>
