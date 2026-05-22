<script lang="ts">
export default {
  name: 'ChannelMessageEditor',
}
</script>

<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarListbox, type ScalarListboxOption } from '@scalar/components/listbox'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { ChannelMessageEntry } from '@scalar/workspace-store/channel-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { computed } from 'vue'

import { CodeInput } from '@/v2/components/code-input'
import { CollapsibleSection } from '@/v2/components/layout'

const { messages, selectedMessageName, payload, environment, canSend } = defineProps<{
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
    messageOptions.value.find(({ id }) => id === selectedMessageName) ?? messageOptions.value[0],
  set: (option) => {
    if (option?.id) {
      emit('update:selectedMessageName', option.id)
    }
  },
})
</script>

<template>
  <CollapsibleSection
    class="group/message"
    :defaultOpen="true"
    :itemCount="messages.length">
    <template #title>Message</template>
    <template
      v-if="canSend"
      #actions>
      <button
        class="text-c-2 request-meta-buttons pr-0.75 pl-1 opacity-0 group-hover/message:opacity-100"
        type="button"
        @click="emit('send')">
        Send message
      </button>
    </template>

    <div class="flex flex-col gap-3 p-3">
      <ScalarListbox
        v-if="messageOptions.length > 1"
        v-model="selectedMessageOption"
        class="font-code w-fit min-w-48 text-sm"
        :options="messageOptions"
        placement="bottom-start">
        <ScalarButton
          class="text-c-2 hover:text-c-1 flex h-full w-fit min-w-0 gap-1.5 px-1.5 py-0.75 text-base font-normal"
          variant="ghost">
          <div class="min-w-0 flex-1 truncate">
            {{ selectedMessageOption?.label ?? 'Select message' }}
          </div>
          <ScalarIconCaretDown
            class="ui-open:rotate-180 mt-0.25 size-3 transition-transform duration-100"
            weight="bold" />
        </ScalarButton>
      </ScalarListbox>

      <CodeInput
        disableEnter
        :environment="environment"
        language="json"
        :modelValue="payload"
        placeholder="{}"
        @update:modelValue="(value) => emit('update:payload', value)" />
    </div>
  </CollapsibleSection>
</template>
