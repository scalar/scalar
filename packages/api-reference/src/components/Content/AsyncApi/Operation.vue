<script setup lang="ts">
import { AsyncApiCodeExample } from '@scalar/blocks/code-example'
import type { SchemaRenderingProps } from '@scalar/blocks/schema'
import { ScalarMarkdown } from '@scalar/components/markdown'
import { ScalarIconArrowDownLeft, ScalarIconArrowUpRight } from '@scalar/icons'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { MergedSecuritySchemes } from '@scalar/workspace-store/request-example'
import type {
  TraversedAsyncApiMessage,
  TraversedAsyncApiOperation,
} from '@scalar/workspace-store/schemas/navigation'
import { computed, useId, useTemplateRef } from 'vue'

import { Anchor } from '@/components/Anchor'
import { Badge } from '@/components/Badge'
import { SectionHeaderTag } from '@/components/Section'
import {
  useDocumentOutline,
  type HeadingLevel,
} from '@/features/document-outline'
import SecurityRequirementBadge from '@/features/Operation/components/SecurityRequirementBadge.vue'
import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'
import { useIntersection } from '@/hooks/use-intersection'

import AsyncApiDocumentation from './AsyncApiDocumentation.vue'
import Bindings from './Bindings.vue'
import CopyAsyncApiMarkdownButton from './CopyAsyncApiMarkdownButton.vue'
import type { AsyncApiSchemaRenderOptions } from './helpers/async-api-render-options'
import { filterChildrenByType } from './helpers/filter-children-by-type'
import { getAsyncApiRequiredSecurity } from './helpers/get-async-api-required-security'
import { getOperationReply } from './helpers/get-operation-reply'
import { pickHeading } from './helpers/pick-heading'
import { resolveAsyncApiOperation } from './helpers/resolve-async-api-nodes'
import Message from './Message.vue'
import OperationMessageExamples from './OperationMessageExamples.vue'
import OperationReply from './OperationReply.vue'

/** Subset of the configuration the nested `Message`/`Schema` renderers need. */
type OperationOptions = AsyncApiSchemaRenderOptions

const {
  operation,
  document,
  clientDocument,
  authStore,
  securitySchemes,
  eventBus,
  options,
  expandedItems = {},
} = defineProps<
  {
    operation: TraversedAsyncApiOperation
    document: AsyncApiDocument
    /** Live document containing server selection and variable edits. */
    clientDocument?: AsyncApiDocument
    authStore?: AuthStore
    securitySchemes?: MergedSecuritySchemes
    eventBus: WorkspaceEventBus | null
    options?: Partial<OperationOptions>
    /** Map of navigation item id to expanded state, shared with the sidebar. */
    expandedItems?: Record<string, boolean>
  } & SchemaRenderingProps
>()

defineSlots<{
  /** Replaces the default Markdown action; an empty slot hides it. */
  actions?: () => unknown
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

/** Heading prefers title, then summary, then the navigation label or operation map key. */
const headingText = computed(() =>
  pickHeading(
    resolvedOperation.value?.title,
    resolvedOperation.value?.summary,
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

/** Use the summary as body text only when there is no description or matching heading. */
const summary = computed((): string => {
  const value = resolvedOperation.value?.summary?.trim() ?? ''
  return resolvedOperation.value?.description?.trim() ||
    value === headingText.value
    ? ''
    : value
})

const description = computed(
  (): string => resolvedOperation.value?.description ?? '',
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
  <section
    :id="operation.id"
    ref="section"
    :aria-labelledby="headerId"
    class="operation"
    :class="`operation--${operation.action}`">
    <div class="operation-header mb-3">
      <Anchor
        class="narrow:basis-full min-w-0 flex-1"
        @copyAnchorUrl="
          () => eventBus?.emit('copy-url:nav-item', { id: operation.id })
        ">
        <span
          class="inline-flex max-w-full flex-wrap items-center gap-2 align-middle">
          <SectionHeaderTag
            :id="headerId"
            class="operation-title"
            :level="headingLevel">
            {{ headingText }}
          </SectionHeaderTag>
          <Badge
            class="operation-action inline-flex shrink-0 items-center gap-1"
            :class="`operation-action--${operation.action}`">
            <component
              :is="
                operation.action === 'send'
                  ? ScalarIconArrowUpRight
                  : ScalarIconArrowDownLeft
              "
              aria-hidden="true"
              class="size-3" />
            {{ operation.action === 'send' ? 'Send' : 'Receive' }}
          </Badge>
        </span>
      </Anchor>
      <div
        v-if="requiredSecurity.state !== 'none'"
        class="operation-auth flex shrink-0 items-center">
        <SecurityRequirementBadge :requiredSecurity />
      </div>
      <div class="ms-auto flex shrink-0 items-center gap-3">
        <slot
          v-if="$slots.actions"
          name="actions" />
        <CopyAsyncApiMarkdownButton
          v-else
          :document
          :selection="{ operation: operation.operationName }" />
      </div>
    </div>

    <div class="operation-overview">
      <p
        v-if="summary"
        class="operation-summary text-c-1 mb-2 [overflow-wrap:anywhere]">
        {{ summary }}
      </p>
      <ScalarMarkdown
        v-if="description"
        class="operation-description"
        :value="description"
        withImages />

      <div
        v-if="resolvedOperation?.bindings || resolvedOperation?.externalDocs"
        class="mt-12 space-y-4">
        <Bindings
          :bindings="resolvedOperation?.bindings"
          :options="options"
          scope="operation" />
        <AsyncApiDocumentation
          :owner="{ externalDocs: resolvedOperation?.externalDocs }" />
      </div>
    </div>

    <div class="operation-example flex min-w-0 flex-col gap-6">
      <AsyncApiCodeExample
        :authStore="authStore"
        :document="clientDocument ?? document"
        :operationName="operation.operationName"
        :securitySchemes="securitySchemes" />
      <OperationMessageExamples
        class="w-full"
        :document="document"
        :messages="messages" />
    </div>

    <div class="operation-details">
      <SectionHeaderTag
        v-if="messages.length || reply"
        class="text-c-1 mt-12 mb-2 block! text-base leading-[1.45] font-medium"
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
        hideExamples
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
        class="mt-12"
        :document="document"
        :eventBus="eventBus"
        :expansion="expansion"
        :level="messagesHeadingLevel"
        :options="options"
        :reply="reply"
        :specificationExtension="specificationExtension" />
    </div>
  </section>
</template>

<style scoped>
.operation {
  scroll-margin-top: var(--refs-viewport-offset);
  margin-top: 90px;
  padding-top: 90px;
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto auto 1fr;
  grid-template-areas: 'heading example' 'overview example' 'details example';
  column-gap: 48px;
}
.operation-overview {
  grid-area: overview;
  min-width: 0;
}
.operation-details {
  grid-area: details;
  min-width: 0;
  /* Message schemas use the available column width for their responsive layout. */
  container: references-container / inline-size;
}
.operation-example {
  grid-area: example;
  align-self: start;
}
@container references-container (max-width: 900px) {
  .operation {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas: 'heading' 'overview' 'example' 'details';
    row-gap: 16px;
  }
  .operation-example {
    position: static;
    max-height: none;
  }
}

.operation-header {
  grid-area: heading;
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.operation-title {
  font-size: var(--font-size, var(--scalar-heading-1));
  font-weight: var(--font-weight, var(--scalar-bold));
  line-height: 1.45;
  color: var(--scalar-color-1);
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
  border-color: color-mix(in srgb, var(--scalar-color-blue), transparent 78%);
}
.operation-action--receive {
  color: color-mix(
    in srgb,
    var(--scalar-color-green),
    var(--scalar-color-1) 28%
  );
  background: color-mix(in srgb, var(--scalar-color-green), transparent 88%);
  border-color: color-mix(in srgb, var(--scalar-color-green), transparent 78%);
}

.operation-description {
  text-align: left;
  margin-top: 12px;
}
.references-classic .operation {
  margin-top: 48px;
  padding-top: 48px;
}
@container references-container (max-width: 900px) {
  .operation-auth {
    order: -1;
    width: 100%;
    margin-left: 0;
  }
  .operation {
    margin-top: 48px;
    padding-top: 48px;
  }
}
/* Space the first message accordion away from the operation header/description. */
.operation-details > :deep(.message) {
  margin-top: 8px;
}
</style>
