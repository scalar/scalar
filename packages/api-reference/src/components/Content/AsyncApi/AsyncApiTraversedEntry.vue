<script setup lang="ts">
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import {
  getResolvedRef,
  mergeSiblingReferences,
} from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  TraversedAsyncApiChannel,
  TraversedEntry,
  TraversedModels,
  TraversedSchema,
  TraversedTag,
} from '@scalar/workspace-store/schemas/navigation'
import { computed } from 'vue'

import Model from '@/components/Content/Models/Model.vue'
import ModelTag from '@/components/Content/Models/ModelTag.vue'
import { Tag } from '@/components/Content/Tags'
import Lazy from '@/components/Lazy/Lazy.vue'
import { getAsyncApiModelSchema } from '@/helpers/get-async-api-model-schema'

import Channel from './Channel.vue'

const {
  entries,
  document,
  expandedItems,
  options,
  eventBus,
  level = 0,
} = defineProps<{
  entries: TraversedEntry[]
  document: AsyncApiDocument
  expandedItems: Record<string, boolean>
  options: Pick<
    ApiReferenceConfigurationRaw,
    | 'layout'
    | 'expandAllSchemaProperties'
    | 'orderRequiredPropertiesFirst'
    | 'orderSchemaPropertiesBy'
    | 'hideModels'
    | 'modelsSectionLabel'
  >
  eventBus: WorkspaceEventBus
  level?: number
}>()

const isTagGroup = (
  entry: TraversedEntry,
): entry is TraversedTag & { isGroup: true } =>
  entry.type === 'tag' && entry.isGroup === true
/**
 * Narrow to a regular (non-group) tag. Tag groups go through a separate branch
 * and must not inflate the sibling-tag count used for `moreThanOneTag`,
 * otherwise `ModernLayout` shows a "Show more" button for a lone tag whenever
 * it sits next to a tag group.
 */
const isTag = (
  entry: TraversedEntry,
): entry is TraversedTag & { isGroup: false } =>
  entry.type === 'tag' && !isTagGroup(entry)
const isChannel = (entry: TraversedEntry): entry is TraversedAsyncApiChannel =>
  entry.type === 'asyncapi-channel'

/** The top-level "Models" container that wraps individual schema entries. */
const isModelsTag = (entry: TraversedEntry): entry is TraversedModels =>
  entry.type === 'models'

/** A single schema rendered as a model. */
const isModel = (entry: TraversedEntry): entry is TraversedSchema =>
  entry.type === 'model'

/**
 * Reusable schemas live under `components.schemas`, the same place OpenAPI keeps them.
 * Resolve the wrapper once (merging `$ref` siblings) so the template can gate the Models section.
 */
const componentSchemas = computed(() =>
  document.components
    ? getResolvedRef(document.components, mergeSiblingReferences).schemas
    : undefined,
)

/** Resolve a schema by name into the shape the shared Model component expects. */
const getModelSchema = (name: string) => getAsyncApiModelSchema(document, name)
</script>

<template>
  <Lazy
    v-for="entry in entries"
    :id="entry.id"
    :key="`${entry.id}-${options.layout}`"
    :expanded="!!expandedItems[entry.id]">
    <Channel
      v-if="isChannel(entry)"
      :channel="entry"
      :document="document"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :isCollapsed="!expandedItems[entry.id]"
      :layout="options.layout"
      :options="options" />

    <Tag
      v-else-if="
        isTag(entry) || (isTagGroup(entry) && options.layout === 'classic')
      "
      :eventBus="eventBus"
      :isCollapsed="!expandedItems[entry.id]"
      :isLoading="false"
      :layout="options.layout"
      :moreThanOneTag="entries.filter(isTag).length > 1"
      :tag="entry">
      <template v-if="entry.children?.length">
        <AsyncApiTraversedEntry
          :document="document"
          :entries="entry.children"
          :eventBus="eventBus"
          :expandedItems="expandedItems"
          :level="level + 1"
          :options="options" />
      </template>
    </Tag>

    <AsyncApiTraversedEntry
      v-else-if="isTagGroup(entry)"
      :document="document"
      :entries="entry.children ?? []"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :level="level + 1"
      :options="options" />

    <!-- Models -->
    <ModelTag
      v-else-if="isModelsTag(entry) && componentSchemas"
      :id="entry.id"
      :eventBus="eventBus"
      :isCollapsed="!expandedItems[entry.id]"
      :layout="options.layout"
      :modelsSectionLabel="options.modelsSectionLabel">
      <AsyncApiTraversedEntry
        :document="document"
        :entries="entry.children ?? []"
        :eventBus="eventBus"
        :expandedItems="expandedItems"
        :level="level + 1"
        :options="options" />
    </ModelTag>

    <Model
      v-else-if="isModel(entry) && getModelSchema(entry.name)"
      :id="entry.id"
      :eventBus="eventBus"
      :isCollapsed="!expandedItems[entry.id]"
      :name="entry.name"
      :options="options"
      :schema="getModelSchema(entry.name)" />
  </Lazy>
</template>
