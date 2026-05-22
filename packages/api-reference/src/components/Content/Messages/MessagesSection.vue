<script setup lang="ts">
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type {
  AsyncApiComponentsObject,
  AsyncApiDocument,
  AsyncApiMessageObject,
} from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  TraversedMessage,
  TraversedMessages,
} from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import { Section, SectionHeader } from '@/components/Section'
import SectionContainer from '@/components/Section/SectionContainer.vue'
import SectionContainerAccordion from '@/components/Section/SectionContainerAccordion.vue'
import SectionHeaderTag from '@/components/Section/SectionHeaderTag.vue'

import Message from './Message.vue'

const MESSAGE_REF_PREFIX = '#/components/messages/'

const { container, document, expandedItems, options } = defineProps<{
  /** Navigation container for the AsyncAPI messages, built in the workspace-store. */
  container: TraversedMessages
  /** Active AsyncAPI document. Used to look up the actual message object per nav entry. */
  document: AsyncApiDocument
  /** Sidebar expand state, keyed by nav entry id. Mirrors the Models render path. */
  expandedItems: Record<string, boolean>
  eventBus: WorkspaceEventBus
  options: Pick<
    ApiReferenceConfigurationRaw,
    | 'layout'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'hideModels'
  >
}>()

const messageEntries = computed(() => {
  const entries = (container.children ?? []).filter(
    (entry): entry is TraversedMessage => entry.type === 'message',
  )

  // `components` may arrive as a `$ref`; the workspace-store magic proxy
  // resolves it transparently at runtime.
  const messages =
    (document.components as AsyncApiComponentsObject | undefined)?.messages ??
    {}

  return entries.flatMap((entry) => {
    const name = entry.ref.startsWith(MESSAGE_REF_PREFIX)
      ? entry.ref.slice(MESSAGE_REF_PREFIX.length)
      : entry.name
    const message = messages[name] as AsyncApiMessageObject | undefined

    if (!message) {
      return []
    }

    return [{ entry, name, message }]
  })
})
</script>
<template>
  <SectionContainer
    v-if="options.layout === 'modern'"
    id="message">
    <Section
      :id="container.id"
      aria-label="Messages"
      @intersecting="
        () => eventBus?.emit('intersecting:nav-item', { id: container.id })
      ">
      <SectionHeader>
        <SectionHeaderTag :level="2">Messages</SectionHeaderTag>
      </SectionHeader>
      <Message
        v-for="{ entry, name, message } in messageEntries"
        :key="entry.id"
        :eventBus
        :id="entry.id"
        :isCollapsed="!expandedItems[entry.id]"
        :message
        :name
        :options />
    </Section>
  </SectionContainer>
  <SectionContainerAccordion
    v-else
    aria-label="Messages"
    class="pb-12"
    :modelValue="!!expandedItems[container.id]"
    @update:modelValue="
      (value) =>
        eventBus?.emit('toggle:nav-item', { id: container.id, open: value })
    ">
    <template #title>
      <SectionHeader :level="2">Messages</SectionHeader>
    </template>
    <Message
      v-for="{ entry, name, message } in messageEntries"
      :key="entry.id"
      :document
      :eventBus
      :id="entry.id"
      :isCollapsed="false"
      :message
      :name
      :options />
  </SectionContainerAccordion>
</template>
