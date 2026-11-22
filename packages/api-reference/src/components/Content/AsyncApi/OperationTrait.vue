<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type {
  AsyncApiDocument,
  AsyncApiOperationObject,
} from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { TraversedAsyncApiComponent } from '@scalar/workspace-store/schemas/navigation'
import { computed, ref, useTemplateRef, watch } from 'vue'

import { CompactSection, SectionHeaderTag } from '@/components/Section'
import { useDocumentOutline } from '@/features/document-outline'
import SecurityRequirementBadge from '@/features/Operation/components/SecurityRequirementBadge.vue'
import type { RequiredSecurity } from '@/features/Operation/helpers/get-required-security'
import { SpecificationExtension } from '@/features/specification-extension'
import { useSpecificationExtensions } from '@/features/specification-extension/use-specification-extensions'
import { useIntersection } from '@/hooks/use-intersection'

import AsyncApiDocumentation from './AsyncApiDocumentation.vue'
import Bindings from './Bindings.vue'
import type { AsyncApiSchemaRenderOptions } from './helpers/async-api-render-options'
import { getAsyncApiRequiredSecurity } from './helpers/get-async-api-required-security'
import { pickHeading } from './helpers/pick-heading'
import { resolveAsyncApiOperationTrait } from './helpers/resolve-async-api-nodes'

/**
 * A reusable operation trait from `components.operationTraits`.
 *
 * Traits are fragments merged into operations, so this shows the fields a trait can carry
 * (prose, security, bindings, external docs, extensions) in the same accordion messages use.
 */
const {
  trait,
  document,
  eventBus,
  options,
  expandedItems = {},
} = defineProps<{
  trait: TraversedAsyncApiComponent
  document: AsyncApiDocument
  eventBus: WorkspaceEventBus | null
  options?: Partial<AsyncApiSchemaRenderOptions>
  /** Map of navigation item id to expanded state, shared with the sidebar. */
  expandedItems?: Record<string, boolean>
}>()

const section = useTemplateRef<HTMLElement>('section')

useIntersection(section, () =>
  eventBus?.emit('intersecting:nav-item', { id: trait.id }),
)

const resolvedTrait = computed(() =>
  resolveAsyncApiOperationTrait(document, trait.name),
)

/** Heading prefers title, then summary, then the navigation label or trait map key. */
const headingText = computed(() =>
  pickHeading(
    resolvedTrait.value?.title,
    resolvedTrait.value?.summary,
    trait.title,
    trait.name,
  ),
)

/** Use the summary as body text only when there is no description or matching heading. */
const summary = computed((): string => {
  const value = resolvedTrait.value?.summary?.trim() ?? ''
  return resolvedTrait.value?.description?.trim() || value === headingText.value
    ? ''
    : value
})

const description = computed(
  (): string => resolvedTrait.value?.description ?? '',
)

/**
 * The security helper only reads `security` from the operation, so the trait's own list is
 * enough to describe the requirements it adds to every operation that applies it.
 */
const requiredSecurity = computed<RequiredSecurity>(() =>
  getAsyncApiRequiredSecurity(
    document,
    resolvedTrait.value?.security
      ? ({ security: resolvedTrait.value.security } as AsyncApiOperationObject)
      : undefined,
    trait.name,
  ),
)

const extensionSelection = useSpecificationExtensions(
  () => resolvedTrait.value,
  () => options?.showExtensions,
)
const { hasExtensions } = extensionSelection

const hasDetails = computed<boolean>(() =>
  Boolean(
    hasExtensions.value ||
    summary.value ||
    description.value ||
    requiredSecurity.value.state !== 'none' ||
    resolvedTrait.value?.bindings ||
    resolvedTrait.value?.externalDocs,
  ),
)

/** Seeded and synced from the sidebar expansion map, like message accordions. */
const isExpanded = ref(expandedItems[trait.id] ?? false)

watch(
  () => expandedItems[trait.id],
  (value) => {
    if (value !== undefined) {
      isExpanded.value = value
    }
  },
)

const onToggle = (open: boolean) => {
  isExpanded.value = open
  eventBus?.emit('toggle:nav-item', { id: trait.id, open })
}

const { level: headingLevel } = useDocumentOutline('model')
</script>

<template>
  <div
    ref="section"
    class="operation-trait">
    <CompactSection
      :id="trait.id"
      class="operation-trait-section"
      :label="headingText"
      :modelValue="isExpanded"
      @copyAnchorUrl="
        () => eventBus?.emit('copy-url:nav-item', { id: trait.id })
      "
      @update:modelValue="onToggle">
      <template #heading>
        <SectionHeaderTag
          class="operation-trait-title break-words"
          :level="headingLevel">
          {{ headingText }}
        </SectionHeaderTag>
      </template>
      <div
        v-if="hasDetails"
        class="flex min-w-0 flex-col gap-4 pt-4 pb-6">
        <p
          v-if="summary"
          class="text-c-1 [overflow-wrap:anywhere]">
          {{ summary }}
        </p>
        <ScalarMarkdown
          v-if="description"
          class="text-left"
          :value="description"
          withImages />
        <div
          v-if="requiredSecurity.state !== 'none'"
          class="flex items-center">
          <SecurityRequirementBadge :requiredSecurity />
        </div>
        <Bindings
          :bindings="resolvedTrait?.bindings"
          :options="options"
          scope="operation" />
        <AsyncApiDocumentation
          :owner="{ externalDocs: resolvedTrait?.externalDocs }" />
        <SpecificationExtension
          compact
          :selection="extensionSelection"
          :showExtensions="options?.showExtensions"
          :value="resolvedTrait" />
      </div>
    </CompactSection>
  </div>
</template>

<style scoped>
.operation-trait {
  scroll-margin-top: var(--refs-viewport-offset);
}
.operation-trait-section :deep(> .section.collapsible-section-content) {
  padding: 0;
}
.operation-trait-title {
  font-size: var(--scalar-heading-3);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
}
</style>
