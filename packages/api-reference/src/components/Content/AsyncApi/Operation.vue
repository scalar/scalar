<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type {
  TraversedAsyncApiMessage,
  TraversedAsyncApiOperation,
} from '@scalar/workspace-store/schemas/navigation'
import { computed, useId, useTemplateRef } from 'vue'

import { Anchor } from '@/components/Anchor'
import { SectionHeaderTag } from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
import OperationScopes from '@/features/Operation/components/OperationScopes.vue'
import { useIntersection } from '@/hooks/use-intersection'

import type { AsyncApiSchemaRenderOptions } from './helpers/async-api-render-options'
import { filterChildrenByType } from './helpers/filter-children-by-type'
import { getAsyncApiRequiredSecurity } from './helpers/get-async-api-required-security'
import { pickHeading } from './helpers/pick-heading'
import { resolveAsyncApiOperation } from './helpers/resolve-async-api-nodes'
import Message from './Message.vue'

/** Subset of the configuration the nested `Message`/`Schema` renderers need. */
type OperationOptions = AsyncApiSchemaRenderOptions

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
const resolvedOperation = computed(() =>
  resolveAsyncApiOperation(document, operation.operationName),
)

/** Heading prefers title, then summary, then the operation map key. */
const headingText = computed(() =>
  pickHeading(
    resolvedOperation.value?.title,
    operation.title,
    operation.operationName,
  ),
)

const description = computed(
  () =>
    resolvedOperation.value?.description ||
    resolvedOperation.value?.summary ||
    '',
)

/** Only the message children of this operation. */
const messages = computed(() =>
  filterChildrenByType<TraversedAsyncApiMessage>(
    operation.children,
    'asyncapi-message',
  ),
)

/** OAuth scopes required by this operation, rendered below the description. */
const requiredSecurity = computed(() =>
  getAsyncApiRequiredSecurity(document, resolvedOperation.value),
)

const { level: headingLevel } = useDocumentOutline('operation')
</script>

<template>
  <div
    :id="operation.id"
    ref="section"
    class="operation"
    :class="`operation--${operation.action}`">
    <div class="operation-header">
      <span
        class="operation-action"
        :class="`operation-action--${operation.action}`">
        {{ operation.action }}
      </span>
      <Anchor
        @copyAnchorUrl="
          () => eventBus?.emit('copy-url:nav-item', { id: operation.id })
        ">
        <SectionHeaderTag
          :id="headerId"
          class="operation-title"
          :level="headingLevel">
          {{ headingText }}
        </SectionHeaderTag>
      </Anchor>
    </div>

    <ScalarMarkdown
      v-if="description"
      class="operation-description"
      :value="description"
      withImages />

    <OperationScopes :requiredSecurity="requiredSecurity" />

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
/*
 * The label is the theme colour on a 12% tint of itself, which in the default light
 * theme leaves send at 4.28:1 and receive at 3.50:1 against their own fill, below the
 * 4.5:1 WCAG 1.4.3 asks of 13px text. Blending the label a fifth of the way toward the
 * body text colour clears it (5.54:1 and 4.68:1) while keeping the hue, and because it
 * blends rather than hard-codes a value, a custom theme's own colours flow through. The
 * blend runs toward --scalar-color-1, so it darkens the label in light mode and lightens
 * it in dark mode, moving away from the tint in both.
 */
.operation-action--send {
  color: color-mix(
    in srgb,
    var(--scalar-color-blue),
    var(--scalar-color-1) 28%
  );
  background: color-mix(in srgb, var(--scalar-color-blue), transparent 88%);
}
.operation-action--receive {
  color: color-mix(
    in srgb,
    var(--scalar-color-green),
    var(--scalar-color-1) 28%
  );
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
