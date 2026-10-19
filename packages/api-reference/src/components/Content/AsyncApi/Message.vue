<script setup lang="ts">
import { getGeneratedPayloadExample } from '@scalar/blocks/code-example'
import {
  Schema,
  type SchemaOptions,
  type SchemaRenderingProps,
} from '@scalar/blocks/schema'
import { ScalarMarkdown } from '@scalar/components/markdown'
import type {
  AsyncApiDocument,
  AsyncApiMessageObject,
} from '@scalar/types/asyncapi/3.1'
import {
  createWorkspaceEventBus,
  type WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
import { resolveAsyncApiSchema } from '@scalar/workspace-store/helpers/resolve-async-api-schema'
import type { TraversedAsyncApiMessage } from '@scalar/workspace-store/schemas/navigation'
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'

import { CompactSection, SectionHeaderTag } from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
import SpecificationExtension from '@/features/specification-extension/SpecificationExtension.vue'
import { createAsyncApiSchemaAdapter } from '@/helpers/create-async-api-schema-adapter'
import { useIntersection } from '@/hooks/use-intersection'

import AsyncApiDocumentation from './AsyncApiDocumentation.vue'
import Bindings from './Bindings.vue'
import {
  resolveSchemaRenderOptions,
  type AsyncApiSchemaRenderOptions,
} from './helpers/async-api-render-options'
import { getCorrelationIdTarget } from './helpers/get-correlation-id-target'
import { pickHeading } from './helpers/pick-heading'
import { resolveAsyncApiMessage } from './helpers/resolve-async-api-nodes'
import MessageExamples from './MessageExamples.vue'
import SchemaSource from './SchemaSource.vue'

/** Subset of the configuration the shared `Schema` renderer needs. */
type SchemaRenderOptions = AsyncApiSchemaRenderOptions

const {
  specificationExtension = SpecificationExtension,
  message,
  document,
  eventBus,
  options,
  expandedItems = {},
  parent = 'operation',
  inline = false,
  hideExamples = false,
  scrollTargetId = '',
  expansion,
} = defineProps<
  {
    /** Direct channel messages sit beneath the channel catalog heading. */
    parent?: 'channel' | 'operation'
    /** Render another occurrence without duplicating navigation anchors or sidebar state. */
    inline?: boolean
    /** Operation examples are displayed together in the right column. */
    hideExamples?: boolean
    message: TraversedAsyncApiMessage
    document: AsyncApiDocument
    eventBus: WorkspaceEventBus | null
    options?: Partial<SchemaRenderOptions>
    /** Map of navigation item id to expanded state, shared with the sidebar. */
    expandedItems?: Record<string, boolean>
  } & SchemaRenderingProps
>()

const instanceId = useId()
const renderedId = computed(() => (inline ? `reply-${instanceId}` : message.id))
const section = useTemplateRef<HTMLElement>('section')

/** Copy links from inline schemas must resolve to their canonical, navigable occurrence. */
const schemaEventBus = computed(() => {
  if (!inline || !eventBus) return eventBus
  const bus = createWorkspaceEventBus()
  bus.on('copy-url:nav-item', ({ id }) => {
    eventBus.emit('copy-url:nav-item', {
      id: message.id + id.slice(renderedId.value.length),
    })
  })
  bus.on('scroll-to:model-by-name', (payload) =>
    eventBus.emit('scroll-to:model-by-name', payload),
  )
  return bus
})

useIntersection(
  section,
  () => !inline && eventBus?.emit('intersecting:nav-item', { id: message.id }),
)

/**
 * Resolve the message from the channel it lives on. The navigation entry only
 * carries the identifying keys, so we walk `document.channels[channelName].messages`.
 */
const resolvedMessage = computed(() =>
  resolveAsyncApiMessage(document, message.channelName, message.messageName),
)

const contentType = computed<string | undefined>(
  () => resolvedMessage.value?.contentType ?? document.defaultContentType,
)

/** Heading prefers title, then summary, then the navigation label or message map key. */
const headingText = computed(() =>
  pickHeading(
    resolvedMessage.value?.title,
    resolvedMessage.value?.summary,
    message.title,
    message.messageName,
  ),
)

/** Use the summary as body text only when there is no description or matching heading. */
const summary = computed((): string => {
  const value = resolvedMessage.value?.summary?.trim() ?? ''
  return resolvedMessage.value?.description?.trim() ||
    value === headingText.value
    ? ''
    : value
})

const description = computed(
  (): string => resolvedMessage.value?.description ?? '',
)

const adaptSchema = computed(() => createAsyncApiSchemaAdapter(document))

/** Preserve format metadata so source-only schemas remain visible. */
const payloadSchema = computed(() =>
  resolveAsyncApiSchema(resolvedMessage.value?.payload),
)
const headersSchema = computed(() =>
  resolveAsyncApiSchema(resolvedMessage.value?.headers),
)

const correlationId = computed<
  Exclude<AsyncApiMessageObject['correlationId'], { $ref: string }>
>(() => getResolvedAsyncApiRef(resolvedMessage.value?.correlationId))
const correlationTarget = computed<ReturnType<typeof getCorrelationIdTarget>>(
  () =>
    resolvedMessage.value && correlationId.value?.location
      ? getCorrelationIdTarget(
          resolvedMessage.value,
          correlationId.value.location,
        )
      : undefined,
)
const correlationBreadcrumb = computed<string[] | undefined>(() =>
  correlationTarget.value
    ? [
        renderedId.value,
        correlationTarget.value.section,
        ...correlationTarget.value.path,
      ]
    : undefined,
)
const correlationTargetId = computed<string | undefined>(() =>
  correlationBreadcrumb.value?.join('.'),
)
const correlationHref = computed<string | undefined>(() =>
  correlationTargetId.value
    ? `#${encodeURIComponent(correlationTargetId.value)}`
    : undefined,
)
const localScrollTarget = ref<string>('')
const activeScrollTarget = computed<string>(
  () => scrollTargetId || localScrollTarget.value,
)

/** The event bus expands lazy parents; standalone messages can reveal their own schema instead. */
const onCorrelationLink = (event: MouseEvent): void => {
  const id = correlationTargetId.value
  if (!id) {
    return
  }
  event.preventDefault()
  if (eventBus && !inline) {
    eventBus.emit('scroll-to:nav-item', { id })
    return
  }
  localScrollTarget.value = id
  expansion?.commitPath(id)
  void nextTick(() => {
    const target = section.value?.ownerDocument.getElementById(id)
    target?.scrollIntoView({ block: 'start' })
    target?.focus({ preventScroll: true })
  })
}

/** Fill in defaults so the shared Schema renderer always receives a complete options object. */
const schemaOptions = computed<SchemaOptions>(() => ({
  hideReadOnly: false,
  ...resolveSchemaRenderOptions(options),
  linkablePropertyPath: correlationBreadcrumb.value,
}))

/**
 * Accordion open state. Kept locally so clicking the header always toggles
 * immediately, and seeded/synced from the shared sidebar expansion map so
 * expanding the message in the sidebar (or deep-linking to it) opens it here too.
 */
const isExpanded = ref(inline ? false : (expandedItems[message.id] ?? false))

watch(
  () => expandedItems[message.id],
  (value) => {
    if (!inline && value !== undefined) {
      isExpanded.value = value
    }
  },
)

/** Toggling the accordion updates local state and keeps the sidebar in sync. */
const onToggle = (open: boolean) => {
  isExpanded.value = open
  if (!inline) {
    eventBus?.emit('toggle:nav-item', { id: message.id, open })
  }
}

// Computed lazily when the expanded accordion renders its examples, then cached until the message changes.
const generatedPayload = computed<unknown>(() =>
  resolvedMessage.value
    ? getGeneratedPayloadExample(resolvedMessage.value)
    : undefined,
)

const { level: headingLevel } = useDocumentOutline(
  parent === 'channel' ? 'channelMessage' : 'message',
)
</script>

<template>
  <div
    ref="section"
    class="message">
    <CompactSection
      :id="renderedId"
      :label="headingText"
      :modelValue="isExpanded"
      @copyAnchorUrl="
        () => eventBus?.emit('copy-url:nav-item', { id: message.id })
      "
      @update:modelValue="onToggle">
      <template #heading>
        <SectionHeaderTag
          class="message-title break-words"
          :level="headingLevel">
          {{ headingText }}
        </SectionHeaderTag>
      </template>
      <div class="space-y-4 pt-2 pb-4">
        <div class="message-layout">
          <div
            v-if="
              summary ||
              description ||
              resolvedMessage?.bindings ||
              resolvedMessage?.externalDocs ||
              correlationId ||
              headersSchema ||
              payloadSchema ||
              contentType
            "
            class="message-schemas min-w-0 space-y-4">
            <p
              v-if="summary"
              class="text-c-1 [overflow-wrap:anywhere]">
              {{ summary }}
            </p>
            <ScalarMarkdown
              v-if="description"
              class="message-description"
              :value="description"
              withImages />

            <Bindings
              :bindings="resolvedMessage?.bindings"
              class="mt-3"
              :options="options"
              scope="message" />
            <AsyncApiDocumentation
              :owner="{ externalDocs: resolvedMessage?.externalDocs }" />

            <div
              v-if="correlationId"
              class="message-schema">
              <div class="message-schema-title">Correlation ID</div>
              <ScalarMarkdown
                v-if="correlationId.description"
                :value="correlationId.description"
                withImages />
              <a
                v-if="correlationHref"
                class="text-c-2 hover:text-c-1 mt-2 block w-fit max-w-full rounded text-sm underline focus-visible:outline"
                :href="correlationHref"
                @click="onCorrelationLink">
                <code class="break-all">{{ correlationId.location }}</code>
              </a>
              <code
                v-else-if="correlationId.location"
                class="text-c-2 mt-2 block text-sm break-all"
                >{{ correlationId.location }}</code
              >
            </div>

            <div
              v-if="headersSchema"
              :id="`${renderedId}.headers`"
              class="message-schema"
              tabindex="-1">
              <div class="message-schema-title">Headers</div>
              <Schema
                v-if="headersSchema.kind === 'schema'"
                :breadcrumb="[renderedId, 'headers']"
                compact
                :eventBus="schemaEventBus"
                :expansion="expansion"
                name="Headers"
                noncollapsible
                :options="schemaOptions"
                :schema="
                  adaptSchema(resolvedMessage?.headers) ?? headersSchema.schema
                "
                :scrollTargetId="activeScrollTarget"
                :specificationExtension="specificationExtension" />
              <SchemaSource
                v-else
                :format="headersSchema.format"
                :value="headersSchema.value" />
            </div>

            <div
              v-if="payloadSchema || contentType"
              :id="`${renderedId}.payload`"
              class="message-payload min-w-0"
              tabindex="-1">
              <div
                class="message-schema-title flex flex-wrap items-baseline justify-between gap-2">
                <span v-if="payloadSchema">Payload</span>
                <span v-else>Content type</span>
                <span
                  v-if="contentType"
                  class="text-c-2 text-sm font-normal break-all"
                  >{{ contentType }}</span
                >
              </div>
              <Schema
                v-if="payloadSchema?.kind === 'schema'"
                :breadcrumb="[renderedId, 'payload']"
                compact
                :eventBus="schemaEventBus"
                :expansion="expansion"
                name="Payload"
                noncollapsible
                :options="schemaOptions"
                :schema="
                  adaptSchema(resolvedMessage?.payload) ?? payloadSchema.schema
                "
                :scrollTargetId="activeScrollTarget"
                :specificationExtension="specificationExtension" />
              <SchemaSource
                v-else-if="payloadSchema"
                :format="payloadSchema.format"
                :value="payloadSchema.value" />
            </div>
          </div>
          <MessageExamples
            v-if="!hideExamples"
            class="message-examples"
            :contentType="contentType"
            :examples="resolvedMessage?.examples"
            :generatedPayload="isExpanded ? generatedPayload : undefined" />
        </div>
      </div>
    </CompactSection>
  </div>
</template>

<style scoped>
.message {
  scroll-margin-top: var(--refs-viewport-offset);
}
.message-title {
  font-size: var(--scalar-heading-3);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
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
  font-size: var(--scalar-small);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  margin-bottom: 8px;
}
.message-layout {
  display: grid;
  gap: 16px;
}
/* Keep examples beside the schema when the reference has room, including embedded layouts. */
@container references-container (min-width: 900px) {
  .message-layout:has(> .message-schemas):has(> .message-examples) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
    gap: 48px;
  }
}
</style>
