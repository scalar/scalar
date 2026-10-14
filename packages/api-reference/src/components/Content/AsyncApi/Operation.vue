<script setup lang="ts">
import type { SchemaRenderingProps } from '@scalar/blocks/schema'
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
import {
  useDocumentOutline,
  type HeadingLevel,
} from '@/features/document-outline'
import SecurityRequirementBadge from '@/features/Operation/components/SecurityRequirementBadge.vue'
import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'
import { useIntersection } from '@/hooks/use-intersection'

import type { AsyncApiSchemaRenderOptions } from './helpers/async-api-render-options'
import { filterChildrenByType } from './helpers/filter-children-by-type'
import { getAsyncApiRequiredSecurity } from './helpers/get-async-api-required-security'
import { getOperationReply } from './helpers/get-operation-reply'
import { pickHeading } from './helpers/pick-heading'
import { resolveAsyncApiOperation } from './helpers/resolve-async-api-nodes'
import Message from './Message.vue'
import OperationReply from './OperationReply.vue'

/** Subset of the configuration the nested `Message`/`Schema` renderers need. */
type OperationOptions = AsyncApiSchemaRenderOptions

const {
  operation,
  document,
  eventBus,
  options,
  expandedItems = {},
} = defineProps<
  {
    operation: TraversedAsyncApiOperation
    document: AsyncApiDocument
    eventBus: WorkspaceEventBus | null
    options?: Partial<OperationOptions>
    /** Map of navigation item id to expanded state, shared with the sidebar. */
    expandedItems?: Record<string, boolean>
  } & SchemaRenderingProps
>()

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

const requiredSecurity = computed<RequiredSecurity>(() =>
  getAsyncApiRequiredSecurity(
    document,
    resolvedOperation.value,
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

const reply = computed(() =>
  getOperationReply(document, resolvedOperation.value),
)

const { level: headingLevel } = useDocumentOutline('asyncApiOperation')
const messagesHeadingLevel = Math.min(6, headingLevel + 1) as HeadingLevel
</script>

<template>
  <div
    :id="operation.id"
    ref="section"
    class="operation mt-6 [&_.message-title]:text-base! [&+.operation]:mt-10 [&+.operation]:pt-10"
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
      <SecurityRequirementBadge :requiredSecurity />
    </div>

    <ScalarMarkdown
      v-if="description"
      class="operation-description"
      :value="description"
      withImages />

    <SectionHeaderTag
      v-if="messages.length || reply"
      class="text-c-1 mt-6 mb-2 block! text-base leading-[1.45] font-medium"
      :level="messagesHeadingLevel">
      Messages
    </SectionHeaderTag>
    <Message
      v-for="message in messages"
      :key="message.id"
      :document="document"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :expansion="expansion"
      :message="message"
      :options="options"
      :scrollTargetId="scrollTargetId"
      :specificationExtension="specificationExtension" />
    <p
      v-if="reply && !messages.length"
      class="text-c-2 rounded-lg border border-dashed px-4 py-3 text-sm">
      No messages listed for this operation.
    </p>
    <OperationReply
      v-if="reply"
      :document="document"
      :eventBus="eventBus"
      :expansion="expansion"
      :level="messagesHeadingLevel"
      :options="options"
      :reply="reply"
      :specificationExtension="specificationExtension" />
  </div>
</template>

<style scoped>
.operation {
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
  margin-top: 8px;
}
</style>
