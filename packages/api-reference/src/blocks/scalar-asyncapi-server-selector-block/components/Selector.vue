<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarListbox } from '@scalar/components/listbox'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { AsyncApiServerEntry } from '@scalar/workspace-store/channel-example'
import { computed } from 'vue'

import { useApiReferenceI18n } from '@/features/i18n'

const { target, servers, selectedServer } = defineProps<{
  /** The selected server */
  selectedServer: AsyncApiServerEntry | null
  /** Available servers */
  servers: AsyncApiServerEntry[]
  /** The id of the target to use for the popover (e.g. address bar) */
  target: string
}>()

const emit = defineEmits<{
  /** Emitted with the server name when the selected server changes */
  (e: 'update:modelValue', value: string): void
}>()

const { translate } = useApiReferenceI18n()

/**
 * AsyncAPI servers are a named map without a single `url`, so we key options by
 * the server name and label them with the constructed connection URL.
 */
const serverOptions = computed(() =>
  servers.map((server) => ({
    id: server.name,
    label: server.url,
  })),
)

const serverUrlWithoutTrailingSlash = computed(
  () => selectedServer?.url?.replace(/\/$/, '') || '',
)

const selectedServerOption = computed(() =>
  serverOptions.value.find((opt) => opt.id === selectedServer?.name),
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
      class="bg-b-1 text-c-1 h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-t-none !rounded-b-xl px-3 py-1.5 text-base/5.25 font-normal whitespace-nowrap -outline-offset-1"
      variant="ghost">
      <span class="sr-only">{{ translate('server.label') }}:</span>
      <span class="overflow-x-auto">{{
        serverUrlWithoutTrailingSlash || translate('server.select')
      }}</span>
      <ScalarIconCaretDown
        class="text-c-2 ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100"
        weight="bold" />
    </ScalarButton>
  </ScalarListbox>
  <div
    v-else
    class="text-c-1 flex h-auto w-full items-center gap-0.75 !rounded-b-xl px-3 py-1.5 text-base leading-[20px] whitespace-nowrap">
    <span class="sr-only">{{ translate('server.label') }}:</span>
    <span class="overflow-x-auto">{{ serverUrlWithoutTrailingSlash }}</span>
  </div>
</template>
