<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type {
  AsyncApiDocument,
  AsyncApiOperationObject,
} from '@scalar/types/asyncapi/3.1'
import { resolveOperationWithTraits } from '@scalar/workspace-store/channel-example'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getResolvedRef,
  mergeSiblingReferences,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  TraversedAsyncApiMessage,
  TraversedAsyncApiOperation,
} from '@scalar/workspace-store/schemas/navigation'
import { computed, useId, useTemplateRef } from 'vue'

import { Anchor } from '@/components/Anchor'
import { SectionHeaderTag } from '@/components/Section'
import { useIntersection } from '@/hooks/use-intersection'

import Message from './Message.vue'

/** Subset of the configuration the nested `Message`/`Schema` renderers need. */
type OperationOptions = Pick<
  ApiReferenceConfigurationRaw,
  | 'orderRequiredPropertiesFirst'
  | 'orderSchemaPropertiesBy'
  | 'expandAllSchemaProperties'
>

const {
  operation,
  document,
  eventBus,
  options,
  expandedItems = {},
} = defineProps<{
  operation: TraversedAsyncApiOperation
  document: AsyncApiDocument
  eventBus: WorkspaceEventBus | null
  options?: Partial<OperationOptions>
  /** Map of navigation item id to expanded state, shared with the sidebar. */
  expandedItems?: Record<string, boolean>
}>()

const headerId = useId()
const section = useTemplateRef<HTMLElement>('section')

useIntersection(section, () =>
  eventBus?.emit('intersecting:nav-item', { id: operation.id }),
)

/**
 * Resolve the operation from the document so we can read its summary/description.
 * Operation traits are merged in (matching the channel connection UI) so trait-only
 * fields render as part of the operation.
 */
const resolvedOperation = computed<AsyncApiOperationObject | undefined>(() => {
  const node = document.operations?.[operation.operationName]
  if (!node) {
    return undefined
  }
  return resolveOperationWithTraits(
    getResolvedRef(node, mergeSiblingReferences),
  )
})

/** Heading prefers title, then summary, then the operation map key. */
const headingText = computed(
  () =>
    resolvedOperation.value?.title?.trim() ||
    operation.title ||
    operation.operationName,
)

const description = computed(
  () =>
    resolvedOperation.value?.description ??
    resolvedOperation.value?.summary ??
    '',
)

/** `send`/`receive` action shown as a small badge next to the heading. */
const action = computed(() => operation.action)

/** Only the message children of this operation. */
const messages = computed(() =>
  (operation.children ?? []).filter(
    (child): child is TraversedAsyncApiMessage =>
      child.type === 'asyncapi-message',
  ),
)
</script>

<template>
  <div
    :id="operation.id"
    ref="section"
    class="operation"
    :class="`operation--${action}`">
    <div class="operation-header">
      <span
        class="operation-action"
        :class="`operation-action--${action}`">
        {{ action }}
      </span>
      <Anchor
        @copyAnchorUrl="
          () => eventBus?.emit('copy-url:nav-item', { id: operation.id })
        ">
        <SectionHeaderTag
          :id="headerId"
          class="operation-title"
          :level="3">
          {{ headingText }}
        </SectionHeaderTag>
      </Anchor>
    </div>

    <ScalarMarkdown
      v-if="description"
      class="operation-description"
      :value="description"
      withImages />

    <Message
      v-for="message in messages"
      :key="message.id"
      :document="document"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :message="message"
      :options="options" />
  </div>
</template>

<style scoped>
.operation {
  margin-top: 32px;
  scroll-margin-top: var(--refs-viewport-offset);
}

.operation-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.operation-title {
  font-size: var(--scalar-heading-3);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
}

/* Filled, color-coded pill carries the primary send/receive signal. */
.operation-action {
  text-transform: uppercase;
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  letter-spacing: 0.05em;
  border-radius: 12px;
  padding: 2px 8px;
  display: inline-flex;
  align-items: center;
}
.operation-action--send {
  color: var(--scalar-color-blue);
  background: color-mix(in srgb, var(--scalar-color-blue), transparent 88%);
}
.operation-action--receive {
  color: var(--scalar-color-green);
  background: color-mix(in srgb, var(--scalar-color-green), transparent 88%);
}

.operation-description {
  text-align: left;
  margin-top: 4px;
}
/* Space the first message accordion away from the operation header/description. */
.operation > :deep(.message) {
  margin-top: 12px;
}
</style>
