<script setup lang="ts">
import type { ClientOptionGroup } from '@scalar/blocks/code-example'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { AuthStore } from '@scalar/workspace-store/entities/auth'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedPathItem } from '@scalar/workspace-store/helpers/for-each-path-item-operation'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { MergedSecuritySchemes } from '@scalar/workspace-store/request-example'
import type {
  TraversedEntry,
  TraversedModels,
  TraversedOperation,
  TraversedSchema,
  TraversedTag,
  TraversedWebhook,
} from '@scalar/workspace-store/schemas/navigation'
import type {
  OpenApiDocument,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import Model from '@/components/Content/Models/Model.vue'
import ModelTag from '@/components/Content/Models/ModelTag.vue'
import { Tag } from '@/components/Content/Tags'
import Lazy from '@/components/Lazy/Lazy.vue'
import { SectionContainer } from '@/components/Section'
import { Operation } from '@/features/Operation'

const {
  level = 0,
  clientOptions,
  document,
  authStore,
  entries,
  insideTagContainer = false,
} = defineProps<{
  /** The auth store */
  authStore: AuthStore
  /** The level of depth */
  level?: number
  /**
   * Whether these entries render inside a parent tag's section container.
   *
   * Nested tags can be arbitrarily deep, and each tag renders its own padded
   * section container. Nesting them would accumulate horizontal padding, so a
   * child tag drops its own padding to keep every section flush left.
   */
  insideTagContainer?: boolean
  /** Traversed entries to render */
  entries: TraversedEntry[]
  /** The document object */
  document: OpenApiDocument
  /** The http client options for the dropdown */
  clientOptions: ClientOptionGroup[]
  /** The subset of the configuration object required for the operation component */
  options: Pick<
    ApiReferenceConfigurationRaw,
    | 'expandAllResponses'
    | 'hideTestRequestButton'
    | 'layout'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'expandAllSchemaProperties'
    | 'schemaLayout'
    | 'schemaKeyboardNav'
    | 'showOperationId'
    | 'hideModels'
    | 'modelsSectionLabel'
  >
  /** Currently selected server for the document */
  selectedServer: ServerObject | null
  /** The merged security schemes for the document and the authentication configuration */
  securitySchemes: MergedSecuritySchemes
  /** Currently selected http client for the document */
  selectedClient: WorkspaceStore['workspace']['x-scalar-default-client']
  /** Currently selected example key, shared across operations for in-sync example pickers */
  selectedExample: WorkspaceStore['workspace']['x-scalar-default-example']
  /** Used to determine if an entry is collapsed */
  expandedItems: Record<string, boolean>
  /** The event bus for the handling all events. */
  eventBus: WorkspaceEventBus
}>()

/**
 * Type guards for different entry types
 */
/**
 * A legacy `x-tagGroups` wrapper. These are not real tags and render without a header of their
 * own (flattened in the modern layout). OpenAPI 3.2 nested-tag sections are real tags that carry
 * `isGroup` but not `isTagGroup`, so they are intentionally excluded here and render through
 * {@link isTag} with their summary heading.
 */
const isTagGroup = (
  entry: TraversedEntry,
): entry is TraversedTag & { isGroup: true } =>
  entry['type'] === 'tag' && entry.isGroup === true && entry.isTagGroup === true

const isTag = (
  entry: TraversedEntry,
): entry is TraversedTag & { isGroup: false } =>
  entry['type'] === 'tag' && !isTagGroup(entry) && entry.id !== 'models'

const isOperation = (entry: TraversedEntry): entry is TraversedOperation =>
  entry['type'] === 'operation'

const isWebhook = (entry: TraversedEntry): entry is TraversedWebhook =>
  entry['type'] === 'webhook'

/** Models are special form of tag entry */
const isModelsTag = (entry: TraversedEntry): entry is TraversedModels =>
  entry['type'] === 'models'

const isModel = (entry: TraversedEntry): entry is TraversedSchema =>
  entry['type'] === 'model'

function getPathValue(entry: TraversedOperation | TraversedWebhook) {
  return isWebhook(entry)
    ? getResolvedPathItem(document.webhooks?.[entry.name])
    : getResolvedPathItem(document.paths?.[entry.path])
}
</script>

<template>
  <!-- The key must be joined with the layout to force a re-render when the layout changes -->
  <!-- Without this we get a timing issue where the lazy bus is reset and the element is not rendered -->
  <Lazy
    v-for="entry in entries"
    :id="entry.id"
    :key="`${entry.id}-${options.layout}`"
    :expanded="!!expandedItems[entry.id]">
    <!-- Operation or Webhook -->
    <SectionContainer
      v-if="isOperation(entry) || isWebhook(entry)"
      :omit="level !== 0">
      <Operation
        :id="entry.id"
        :authStore
        :clientOptions
        :document
        :eventBus
        :isCollapsed="!expandedItems[entry.id]"
        :isWebhook="isWebhook(entry)"
        :method="entry.method"
        :options="options"
        :path="isWebhook(entry) ? entry.name : entry.path"
        :pathValue="getPathValue(entry)"
        :securitySchemes="securitySchemes"
        :selectedClient="selectedClient"
        :selectedExample="selectedExample"
        :server="selectedServer" />
    </SectionContainer>

    <!-- Webhook Group, Tag or Tag Group (only in classic layout) -->
    <Tag
      v-else-if="
        isTag(entry) || (isTagGroup(entry) && options.layout === 'classic')
      "
      :eventBus
      :isCollapsed="!expandedItems[entry.id]"
      :layout="options.layout"
      :moreThanOneTag="entries.filter(isTag).length > 1"
      :nested="insideTagContainer"
      :tag="entry">
      <template v-if="'children' in entry && entry.children?.length">
        <TraversedEntry
          :authStore
          :clientOptions
          :document
          :entries="entry.children"
          :eventBus
          :expandedItems
          :insideTagContainer="true"
          :level="level + 1"
          :options
          :securitySchemes
          :selectedClient
          :selectedExample
          :selectedServer>
        </TraversedEntry>
      </template>
    </Tag>

    <!-- Display tag group entries for modern layout (flattened) -->
    <!--
      The wrapping element carries the tag group id so it remains a scroll
      target. Modern layout flattens groups and renders no header of their own,
      so without this anchor, selecting a tag group (from search or the sidebar)
      would have nothing to scroll to.
    -->
    <div
      v-else-if="isTagGroup(entry)"
      :id="entry.id">
      <TraversedEntry
        :authStore
        :clientOptions
        :document
        :entries="entry.children || []"
        :eventBus
        :expandedItems
        :insideTagContainer="insideTagContainer"
        :level="level + 1"
        :options
        :securitySchemes
        :selectedClient
        :selectedExample
        :selectedServer>
      </TraversedEntry>
    </div>

    <!-- Models -->
    <ModelTag
      v-else-if="isModelsTag(entry) && document.components?.schemas"
      :id="entry.id"
      :eventBus
      :isCollapsed="!expandedItems[entry.id]"
      :layout="options.layout"
      :modelsSectionLabel="options.modelsSectionLabel">
      <TraversedEntry
        :authStore
        :clientOptions
        :document
        :entries="entry.children || []"
        :eventBus
        :expandedItems="expandedItems"
        :level="level + 1"
        :options
        :securitySchemes
        :selectedClient
        :selectedExample
        :selectedServer>
      </TraversedEntry>
    </ModelTag>

    <Model
      v-else-if="isModel(entry) && document.components?.schemas?.[entry.name]"
      :id="entry.id"
      :document
      :eventBus
      :isCollapsed="!expandedItems[entry.id]"
      :name="entry.name"
      :options
      :schema="getResolvedRef(document.components.schemas[entry.name])">
    </Model>
  </Lazy>
</template>
