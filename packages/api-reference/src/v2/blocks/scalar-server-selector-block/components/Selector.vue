<script setup lang="ts">
import { ScalarButton, ScalarListbox } from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/server'
import { computed } from 'vue'

const { target, servers, xSelectedServer } = defineProps<{
  /** The selected server URL */
  xSelectedServer?: string
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

const server = computed(() => {
  return servers.find((s) => s.url === xSelectedServer)
})

const serverUrlWithoutTrailingSlash = computed(() => {
  if (server.value?.url.endsWith('/')) {
    return server.value?.url.slice(0, -1)
  }
  return server.value?.url || ''
})

const selectedServer = computed({
  get: () => {
    if (xSelectedServer && serverOptions.value.length > 0) {
      return serverOptions.value.find((opt) => opt.id === xSelectedServer)
    }
    return undefined
  },
  set: (option) => {
    if (option) {
      emit('update:modelValue', option.id)
    }
  },
})

// For testing
defineExpose({
  server,
  servers,
  serverUrlWithoutTrailingSlash,
  serverOptions,
  selectedServer,
})
</script>
<template>
  <ScalarListbox
    ref="elem"
    v-if="serverOptions.length > 1"
    v-model="selectedServer"
    :options="serverOptions"
    placement="bottom-start"
    resize
    :target="target"
    class="group">
    <ScalarButton
      class="bg-b-1 text-c-1 h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-t-none rounded-b-lg px-3 py-1.5 text-base font-normal whitespace-nowrap -outline-offset-1"
      variant="ghost">
      <span class="sr-only">Server:</span>
      <span class="overflow-x-auto">{{ serverUrlWithoutTrailingSlash }}</span>
      <ScalarIconCaretDown
        weight="bold"
        class="text-c-2 ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100" />
    </ScalarButton>
  </ScalarListbox>
  <div
    v-else
    class="text-c-1 flex h-auto w-full items-center gap-0.75 rounded-b-lg px-3 py-1.5 text-base leading-[20px] whitespace-nowrap">
    <span class="sr-only">Server:</span>
    <span class="overflow-x-auto">{{ serverUrlWithoutTrailingSlash }}</span>
  </div>
</template>
