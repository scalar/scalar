<script setup lang="ts">
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
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { Schema, SchemaHeading } from '@/components/Content/Schema'
import { CompactSection, SectionHeaderTag } from '@/components/Section'

const { message, document, eventBus, isCollapsed } = defineProps<{
  message: TraversedAsyncApiMessage
  document: AsyncApiDocument
  eventBus: WorkspaceEventBus | null
  isCollapsed: boolean
}>()

/**
 * Resolve the message from the document so we can read its summary and payload.
 * The navigation entry only carries the identifying keys.
 */
const resolvedMessage = computed<AsyncApiMessageObject | undefined>(() => {
  const channelNode = document.channels?.[message.channelName]
  const channel = channelNode
    ? getResolvedRef(channelNode, mergeSiblingReferences)
    : undefined

  const messageNode = channel?.messages?.[message.messageName]
  return messageNode
    ? getResolvedRef(messageNode, mergeSiblingReferences)
    : undefined
})

/**
 * Heading shown on the accordion trigger.
 *
 * Prefers the human-friendly `title`, then falls back to the machine-friendly
 * `name`, and finally to the message map key.
 */
const headingText = computed(() => {
  const title = resolvedMessage.value?.title?.trim()
  const name = resolvedMessage.value?.name?.trim()
  return title || name || message.messageName
})

const summary = computed(() => resolvedMessage.value?.summary?.trim() ?? '')

/**
 * The message payload, rendered with the shared Schema component.
 *
 * AsyncAPI payloads may be a bare JSON Schema or a Multi Format Schema Object
 * (`{ schemaFormat, schema }`), and either form may sit behind a `$ref`. We
 * resolve the reference and unwrap the multi-format wrapper so the Schema
 * component always receives a plain schema.
 */
const payloadSchema = computed<SchemaObject | undefined>(() => {
  const payloadNode = resolvedMessage.value?.payload
  if (!payloadNode) {
    return undefined
  }

  const payload = getResolvedRef(payloadNode, mergeSiblingReferences)
  const schema =
    payload && typeof payload === 'object' && 'schema' in payload
      ? payload.schema
      : payload

  return schema as SchemaObject | undefined
})
</script>

<template>
  <CompactSection
    :id="message.id"
    :label="headingText"
    :modelValue="!isCollapsed"
    @copyAnchorUrl="
      () => eventBus?.emit('copy-url:nav-item', { id: message.id })
    "
    @update:modelValue="
      (value) =>
        eventBus?.emit('toggle:nav-item', { id: message.id, open: value })
    ">
    <template #heading>
      <SectionHeaderTag :level="3">
        <SchemaHeading
          v-if="payloadSchema"
          :name="headingText"
          :value="payloadSchema" />
        <template v-else>{{ headingText }}</template>
      </SectionHeaderTag>
    </template>

    <p
      v-if="summary"
      class="mb-2">
      {{ summary }}
    </p>
    <Schema
      v-if="payloadSchema"
      :eventBus="eventBus"
      hideHeading
      :level="1"
      noncollapsible
      :options="{}"
      :schema="payloadSchema" />
  </CompactSection>
</template>
