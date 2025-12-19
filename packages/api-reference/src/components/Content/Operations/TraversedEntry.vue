<script setup lang="ts">
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas'
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
  entries,
} = defineProps<{
  /** The level of depth */
  level?: number
  /** Traversed entries to render */
  entries: TraversedEntry[]
  /** The configuration object */
  config: ApiReferenceConfiguration
  /** The document object */
  document: WorkspaceDocument
  /** The http client options for the dropdown */
  clientOptions: ClientOptionGroup[]
  /** Currently selected server for the document */
  selectedServer: ServerObject | null
  /** Currently selected security for the document */
  selectedSecurity: OpenApiDocument['x-scalar-selected-security']
  /** Currently selected http client for the document */
  xScalarDefaultClient: WorkspaceStore['workspace']['x-scalar-default-client']
  /** Used to determine if an entry is collapsed */
  expandedItems: Record<string, boolean>
  /** The event bus for the handling all events. */
  eventBus: WorkspaceEventBus
}>()

/**
 * Type guards for different entry types
 */
const isTagGroup = (
  entry: TraversedEntry,
): entry is TraversedTag & { isGroup: true } =>
  entry['type'] === 'tag' && entry.isGroup === true

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
    ? document.webhooks?.[entry.name]
    : document.paths?.[entry.path]
}
</script>

<template>
  <!-- The key must be joined with the layout to force a re-render when the layout changes -->
  <!-- Without this we get a timing issue where the lazy bus is reset and the element is not rendered -->
  <Lazy
    v-for="entry in entries"
    :id="entry.id"
    :key="`${entry.id}-${config.layout}`">
    <!-- Operation or Webhook -->
    <SectionContainer
      v-if="isOperation(entry) || isWebhook(entry)"
      :omit="level !== 0">
      <Operation
        :id="entry.id"
        :clientOptions
        :config
        :document
        :eventBus
        :isCollapsed="!expandedItems[entry.id]"
        :isWebhook="isWebhook(entry)"
        :method="entry.method"
        :path="isWebhook(entry) ? entry.name : entry.path"
        :pathValue="getPathValue(entry)"
        :selectedSecurity
        :server="selectedServer"
        :xScalarDefaultClient="xScalarDefaultClient" />
    </SectionContainer>

    <!-- Webhook Group or Tag -->
    <Tag
      v-else-if="isTag(entry)"
      :eventBus
      :isCollapsed="!expandedItems[entry.id]"
      :isLoading="false"
      :layout="config.layout"
      :moreThanOneTag="entries.filter(isTag).length > 1"
      :tag="entry">
      <template v-if="'children' in entry && entry.children?.length">
        <TraversedEntry
          :clientOptions
          :config
          :document
          :entries="entry.children"
          :eventBus
          :expandedItems
          :level="level + 1"
          :selectedSecurity
          :selectedServer
          :xScalarDefaultClient="xScalarDefaultClient">
        </TraversedEntry>
      </template>
    </Tag>

    <!-- Tag Group -->
    <TraversedEntry
      v-else-if="isTagGroup(entry)"
      :clientOptions
      :config
      :document
      :entries="entry.children || []"
      :eventBus
      :expandedItems
      :level="level + 1"
      :selectedSecurity
      :selectedServer
      :xScalarDefaultClient="xScalarDefaultClient">
    </TraversedEntry>

    <!-- Models -->
    <ModelTag
      v-else-if="isModelsTag(entry) && document.components?.schemas"
      :id="entry.id"
      :eventBus
      :isCollapsed="!expandedItems[entry.id]"
      :layout="config.layout">
      <TraversedEntry
        :clientOptions
        :config
        :document
        :entries="entry.children || []"
        :eventBus
        :expandedItems="expandedItems"
        :level="level + 1"
        :selectedSecurity
        :selectedServer
        :xScalarDefaultClient="xScalarDefaultClient">
      </TraversedEntry>
    </ModelTag>

    <Model
      v-else-if="isModel(entry) && document.components?.schemas?.[entry.name]"
      :id="entry.id"
      :config
      :eventBus="eventBus"
      :isCollapsed="!expandedItems[entry.id]"
      :name="entry.name"
      :schema="getResolvedRef(document.components.schemas[entry.name])">
    </Model>
  </Lazy>
</template>
