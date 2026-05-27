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

const CUSTOM_MESSAGE_ID = 'scalar-custom-message'
const CUSTOM_MESSAGE_OPTION = {
  id: CUSTOM_MESSAGE_ID,
  label: 'Custom message',
} satisfies ScalarListboxOption

const messageOptions = computed<ScalarListboxOption[]>(() => [
  ...messages.map(({ name, message }) => ({
    id: name,
    label: message.title ?? name,
  })),
  CUSTOM_MESSAGE_OPTION,
])

const handleMessageSelect = (option?: ScalarListboxOption): void => {
  if (!option?.id) {
    return
  }

  emit('update:selectedMessageName', option.id)

  if (option.id === CUSTOM_MESSAGE_ID) {
    emit('update:payload', '{}')
  }
}

const selectedMessageOption = computed<ScalarListboxOption | undefined>({
  get: () =>
    messageOptions.value.find(({ id }) => id === selectedMessageName) ??
    messageOptions.value[0],
  set: handleMessageSelect,
})

const isCustomMessageSelected = computed(
  () => selectedMessageOption.value?.id === CUSTOM_MESSAGE_ID,
)

const sendMessageLabel = computed(() =>
  canSend ? 'Send message' : 'Connect to send',
)

const sendMessageTitle = computed(() =>
  canSend ? 'Send message' : 'Connect before sending a message',
)
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

        <div class="mr-1 flex shrink-0 items-center gap-1">
          <ScalarButton
            v-if="!isCustomMessageSelected"
            class="h-6 px-2 text-xs"
            size="sm"
            type="button"
            variant="ghost"
            @click="handleMessageSelect(CUSTOM_MESSAGE_OPTION)">
            New message
          </ScalarButton>
          <ScalarButton
            class="h-6 px-2 text-xs"
            :disabled="!canSend"
            size="sm"
            :title="sendMessageTitle"
            type="button"
            @click="emit('send')">
            {{ sendMessageLabel }}
          </ScalarButton>
        </div>
      </DataTableHeader>

      <DataTableRow>
        <CodeInput
          class="border-t px-3"
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
