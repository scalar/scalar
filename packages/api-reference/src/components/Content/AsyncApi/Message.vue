<script setup lang="ts">
import { Schema, type SchemaOptions } from '@scalar/blocks/schema'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref, useId, useTemplateRef, watch } from 'vue'

import { Anchor } from '@/components/Anchor'
import { SectionAccordion, SectionHeaderTag } from '@/components/Section'
import {
  getAsyncApiMessageHeadersSchema,
  getAsyncApiMessagePayloadSchema,
} from '@/helpers/get-async-api-message-payload-schema'
import { useIntersection } from '@/hooks/use-intersection'

import AsyncApiLabels from './AsyncApiLabels.vue'
import {
  resolveSchemaRenderOptions,
  type AsyncApiSchemaRenderOptions,
} from './helpers/async-api-render-options'
import { getChannelServerLabels } from './helpers/get-async-api-labels'
import { pickHeading } from './helpers/pick-heading'
import {
  resolveAsyncApiChannel,
  resolveAsyncApiMessage,
} from './helpers/resolve-async-api-nodes'

/** Subset of the configuration the shared `Schema` renderer needs. */
type SchemaRenderOptions = AsyncApiSchemaRenderOptions

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
const resolvedMessage = computed(() =>
  resolveAsyncApiMessage(document, message.channelName, message.messageName),
)

/** Heading prefers the human-friendly title, falling back to the message map key. */
const headingText = computed(() =>
  pickHeading(resolvedMessage.value?.title, message.title, message.messageName),
)

const description = computed(
  () =>
    resolvedMessage.value?.description || resolvedMessage.value?.summary || '',
)

/**
 * Protocol keys declared directly on the message's protocol-specific `bindings`
 * (for example `ws`, `kafka`). The bindings object may be a `$ref`, so it is resolved
 * before reading the keys. Keys are lowercased to match the server protocols (which the
 * helper normalizes), so the union below de-duplicates case-insensitively.
 */
const messageBindingProtocols = computed(() => {
  const bindings = resolvedMessage.value?.bindings
  if (!bindings) {
    return []
  }
  const resolved = getResolvedRef(bindings)
  return Object.entries(resolved)
    .filter(([, value]) => value != null)
    .map(([protocol]) => protocol.toLowerCase())
})

/**
 * Protocol labels for the message. A message is carried over whatever protocols its
 * channel's servers speak, so we start from the channel's server protocols and union in
 * any extra protocols the message declares its own bindings for. Without this a
 * multi-protocol message would only surface the single protocol it happens to declare a
 * binding for (or none at all).
 */
const protocolLabels = computed(() => {
  const channel = resolveAsyncApiChannel(document, message.channelName)
  const { protocols } = getChannelServerLabels(document, channel)
  return [...new Set([...protocols, ...messageBindingProtocols.value])]
})

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
  ...resolveSchemaRenderOptions(options),
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
          <span class="message-heading">
            <SectionHeaderTag
              :id="headerId"
              class="message-title"
              :level="4">
              {{ headingText }}
            </SectionHeaderTag>
            <AsyncApiLabels :protocols="protocolLabels" />
          </span>
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
/*
 * Lay the heading and protocol labels out on one wrapping row. The labels live inside the
 * Anchor slot so the copy-anchor "#" button (absolutely positioned just past the end of the
 * slot content on hover) trails after the last pill instead of overlapping the first one.
 */
.message-heading {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
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
