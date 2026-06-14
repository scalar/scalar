<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type {
  AsyncApiDocument,
  AsyncApiMessageObject,
} from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getResolvedRef,
  mergeSiblingReferences,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref, useId, useTemplateRef, watch } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Schema } from '@/components/Content/Schema'
import type { SchemaOptions } from '@/components/Content/Schema/types'
import { SectionAccordion, SectionHeaderTag } from '@/components/Section'
import {
  getAsyncApiMessageHeadersSchema,
  getAsyncApiMessagePayloadSchema,
} from '@/helpers/get-async-api-message-payload-schema'
import { useIntersection } from '@/hooks/use-intersection'

/** Subset of the configuration the shared `Schema` renderer needs. */
type SchemaRenderOptions = Pick<
  ApiReferenceConfigurationRaw,
  | 'orderRequiredPropertiesFirst'
  | 'orderSchemaPropertiesBy'
  | 'expandAllSchemaProperties'
>

const {
  message,
  document,
  eventBus,
  options,
  expandedItems = {},
} = defineProps<{
  message: TraversedAsyncApiMessage
  document: AsyncApiDocument
  eventBus: WorkspaceEventBus | null
  options?: Partial<SchemaRenderOptions>
  /** Map of navigation item id to expanded state, shared with the sidebar. */
  expandedItems?: Record<string, boolean>
}>()

const headerId = useId()
const section = useTemplateRef<HTMLElement>('section')

useIntersection(section, () =>
  eventBus?.emit('intersecting:nav-item', { id: message.id }),
)

/**
 * Resolve the message from the channel it lives on. The navigation entry only
 * carries the identifying keys, so we walk `document.channels[channelName].messages`.
 */
const resolvedMessage = computed<AsyncApiMessageObject | undefined>(() => {
  const channelNode = document.channels?.[message.channelName]
  const channel = channelNode
    ? getResolvedRef(channelNode, mergeSiblingReferences)
    : undefined
  const node = channel?.messages?.[message.messageName]
  return node ? getResolvedRef(node, mergeSiblingReferences) : undefined
})

/** Heading prefers the human-friendly title, falling back to the message map key. */
const headingText = computed(
  () =>
    resolvedMessage.value?.title?.trim() ||
    message.title ||
    message.messageName,
)

const description = computed(
  () =>
    resolvedMessage.value?.description ?? resolvedMessage.value?.summary ?? '',
)

/** Payload schema, unwrapped from `$ref`s and Multi Format Schema wrappers. */
const payloadSchema = computed(() =>
  resolvedMessage.value
    ? getAsyncApiMessagePayloadSchema(resolvedMessage.value)
    : undefined,
)

/** Header schema, unwrapped the same way as the payload. */
const headersSchema = computed(() =>
  resolvedMessage.value
    ? getAsyncApiMessageHeadersSchema(resolvedMessage.value)
    : undefined,
)

/** Fill in defaults so the shared Schema renderer always receives a complete options object. */
const schemaOptions = computed<SchemaOptions>(() => ({
  hideReadOnly: false,
  orderRequiredPropertiesFirst: options?.orderRequiredPropertiesFirst ?? false,
  orderSchemaPropertiesBy: options?.orderSchemaPropertiesBy ?? 'preserve',
  expandAllSchemaProperties: options?.expandAllSchemaProperties ?? false,
}))

/**
 * Accordion open state. Kept locally so clicking the header always toggles
 * immediately, and seeded/synced from the shared sidebar expansion map so
 * expanding the message in the sidebar (or deep-linking to it) opens it here too.
 */
const isExpanded = ref(expandedItems[message.id] ?? false)

watch(
  () => expandedItems[message.id],
  (value) => {
    if (value !== undefined) {
      isExpanded.value = value
    }
  },
)

/** Toggling the accordion updates local state and keeps the sidebar in sync. */
const onToggle = (open: boolean) => {
  isExpanded.value = open
  eventBus?.emit('toggle:nav-item', { id: message.id, open })
}
</script>

<template>
  <div
    :id="message.id"
    ref="section"
    class="message">
    <SectionAccordion
      class="message-accordion"
      :modelValue="isExpanded"
      @update:modelValue="onToggle">
      <template #title>
        <Anchor
          @copyAnchorUrl="
            () => eventBus?.emit('copy-url:nav-item', { id: message.id })
          ">
          <SectionHeaderTag
            :id="headerId"
            class="message-title"
            :level="4">
            {{ headingText }}
          </SectionHeaderTag>
        </Anchor>
      </template>

      <ScalarMarkdown
        v-if="description"
        class="message-description"
        :value="description"
        withImages />

      <div
        v-if="headersSchema"
        class="message-schema">
        <div class="message-schema-title">Headers</div>
        <Schema
          compact
          :eventBus="eventBus"
          name="Headers"
          noncollapsible
          :options="schemaOptions"
          :schema="headersSchema" />
      </div>

      <div
        v-if="payloadSchema"
        class="message-schema">
        <div class="message-schema-title">Payload</div>
        <Schema
          compact
          :eventBus="eventBus"
          name="Payload"
          noncollapsible
          :options="schemaOptions"
          :schema="payloadSchema" />
      </div>
    </SectionAccordion>
  </div>
</template>

<style scoped>
.message {
  scroll-margin-top: var(--refs-viewport-offset);
}
.message-title {
  font-size: var(--scalar-heading-4);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
}
/* Pad the expanded body so the description and schemas don't sit flush against the border. */
.message-accordion :deep(.section-accordion-content-card) {
  padding: 12px;
}
.message-description {
  padding-bottom: 4px;
  text-align: left;
}
.message-schema {
  margin-top: 12px;
}
.message-schema:first-child {
  margin-top: 0;
}
.message-schema-title {
  font-size: var(--scalar-font-size-2);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  padding-bottom: 8px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  margin-bottom: 8px;
}
</style>
