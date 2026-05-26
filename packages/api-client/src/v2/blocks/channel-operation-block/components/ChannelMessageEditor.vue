<script lang="ts">
export default {
  name: 'ChannelMessageEditor',
}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import {
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components/listbox'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { ChannelMessageEntry } from '@scalar/workspace-store/channel-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed } from 'vue'

import { CodeInput } from '@/v2/components/code-input'
import {
  DataTable,
  DataTableHeader,
  DataTableRow,
} from '@/v2/components/data-table'
import { CollapsibleSection } from '@/v2/components/layout'

const { messages, selectedMessageName, payload, environment, canSend } =
  defineProps<{
    /** Messages available for this operation */
    messages: ChannelMessageEntry[]
    /** Name of the currently selected message */
    selectedMessageName: string | null
    /** Outgoing JSON payload */
    payload: string
    /** Active environment for variable substitution in the editor */
    environment: XScalarEnvironment
    /** Whether sending is allowed for this operation */
    canSend: boolean
  }>()

const emit = defineEmits<{
  (e: 'update:selectedMessageName', value: string): void
  (e: 'update:payload', value: string): void
  (e: 'send'): void
}>()

const messageOptions = computed<ScalarListboxOption[]>(() =>
  messages.map(({ name, message }) => ({
    id: name,
    label: message.title ?? name,
  })),
)

const selectedMessageOption = computed<ScalarListboxOption | undefined>({
  get: () =>
    messageOptions.value.find(({ id }) => id === selectedMessageName) ??
    messageOptions.value[0],
  set: (option) => {
    if (option?.id) {
      emit('update:selectedMessageName', option.id)
    }
  },
})
</script>

<template>
  <CollapsibleSection
    :defaultOpen="true"
    :itemCount="messages.length">
    <template #title>Message</template>

    <DataTable
      :columns="['']"
      presentational>
      <DataTableHeader
        class="relative col-span-full flex h-8 cursor-pointer items-center justify-between gap-2 border-r-0 !p-0">
        <ScalarListbox
          v-if="messageOptions.length > 1"
          v-slot="{ open }"
          v-model="selectedMessageOption"
          class="font-code min-w-0 text-sm"
          :options="messageOptions"
          placement="bottom-start">
          <ScalarButton
            class="text-c-2 hover:text-c-1 flex h-full w-fit max-w-full min-w-0 gap-1.5 px-3 font-normal"
            fullWidth
            variant="ghost">
            <span class="min-w-0 truncate">
              {{ selectedMessageOption?.label ?? 'Select message' }}
            </span>
            <ScalarIconCaretDown
              class="mt-0.25 size-3 shrink-0 transition-transform duration-100"
              :class="{ 'rotate-180': open }"
              weight="bold" />
          </ScalarButton>
        </ScalarListbox>

        <span
          v-else
          class="text-c-2 font-code min-w-0 truncate px-3 text-sm font-normal">
          {{ selectedMessageOption?.label ?? 'Message body' }}
        </span>

        <ScalarButton
          class="mr-1 h-6 shrink-0 px-2 text-xs"
          :disabled="!canSend"
          size="sm"
          type="button"
          @click="emit('send')">
          Send message
        </ScalarButton>
      </DataTableHeader>

      <DataTableRow>
        <CodeInput
          class="border-t px-3"
          disableEnter
          :environment="environment"
          language="json"
          lineNumbers
          lint
          :modelValue="payload"
          placeholder="{}"
          withFakeData
          @update:modelValue="(value) => emit('update:payload', value)" />
      </DataTableRow>
    </DataTable>
  </CollapsibleSection>
</template>

<style scoped>
:deep(.cm-content) {
  font-size: var(--scalar-small);
}
</style>
