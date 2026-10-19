<script setup lang="ts">
import type { SchemaRenderingProps } from '@scalar/blocks/schema'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { AsyncApiDocument } from '@scalar/types/asyncapi/3.1'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedAsyncApiRef } from '@scalar/workspace-store/helpers/get-resolved-async-api-ref'
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
import { createAsyncApiSchemaAdapter } from '@/helpers/create-async-api-schema-adapter'
import { resolveAsyncApiSchema } from '@/helpers/resolve-async-api-schema'

import Channel from './Channel.vue'
import SourceModel from './SourceModel.vue'

const {
  entries,
  document,
  clientDocument,
  expandedItems,
  options,
  eventBus,
  level = 0,
} = defineProps<
  {
    entries: TraversedEntry[]
    document: AsyncApiDocument
    /** Live document containing server selection and variable edits. */
    clientDocument?: AsyncApiDocument
    expandedItems: Record<string, boolean>
    options: Pick<
      ApiReferenceConfigurationRaw,
      | 'layout'
      | 'expandAllSchemaProperties'
      | 'schemaKeyboardNav'
      | 'orderRequiredPropertiesFirst'
      | 'orderSchemaPropertiesBy'
      | 'hideModels'
      | 'modelsSectionLabel'
    >
    eventBus: WorkspaceEventBus
    level?: number
  } & SchemaRenderingProps
>()

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
 * Resolve the wrapper once (ignoring `$ref` siblings) so the template can gate the Models section.
 */
const componentSchemas = computed(() =>
  document.components
    ? getResolvedAsyncApiRef(document.components)?.schemas
    : undefined,
)

const adaptSchema = computed(() => createAsyncApiSchemaAdapter(document))

/** Resolve once per entry and retain source-only models alongside JSON Schema models. */
const resolvedEntries = computed(() =>
  entries.map((entry) => ({
    entry,
    schema: isModel(entry)
      ? resolveAsyncApiSchema(componentSchemas.value?.[entry.name])
      : undefined,
  })),
)
</script>

<template>
  <Lazy
    v-for="{ entry, schema } in resolvedEntries"
    :id="entry.id"
    :key="`${entry.id}-${options.layout}`"
    :expanded="!!expandedItems[entry.id]">
    <Channel
      v-if="isChannel(entry)"
      :channel="entry"
      :clientDocument="clientDocument"
      :document="document"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :expansion="expansion"
      :isCollapsed="!expandedItems[entry.id]"
      :layout="options.layout"
      :level="level"
      :options="options"
      :scrollTargetId="scrollTargetId"
      :specificationExtension="specificationExtension" />

    <Tag
      v-else-if="
        isTag(entry) || (isTagGroup(entry) && options.layout === 'classic')
      "
      :asyncApiDocument="document"
      :eventBus="eventBus"
      :isCollapsed="!expandedItems[entry.id]"
      :layout="options.layout"
      :moreThanOneTag="entries.filter(isTag).length > 1"
      :nested="options.layout === 'classic' && level !== 0"
      :tag="entry">
      <template v-if="entry.children?.length">
        <AsyncApiTraversedEntry
          :clientDocument="clientDocument"
          :document="document"
          :entries="entry.children"
          :eventBus="eventBus"
          :expandedItems="expandedItems"
          :expansion="expansion"
          :level="level + 1"
          :options="options"
          :scrollTargetId="scrollTargetId"
          :specificationExtension="specificationExtension" />
      </template>
    </Tag>

    <AsyncApiTraversedEntry
      v-else-if="isTagGroup(entry)"
      :clientDocument="clientDocument"
      :document="document"
      :entries="entry.children ?? []"
      :eventBus="eventBus"
      :expandedItems="expandedItems"
      :expansion="expansion"
      :level="level + 1"
      :options="options"
      :scrollTargetId="scrollTargetId"
      :specificationExtension="specificationExtension" />

    <!-- Models -->
    <ModelTag
      v-else-if="isModelsTag(entry) && componentSchemas"
      :id="entry.id"
      :eventBus="eventBus"
      :isCollapsed="!expandedItems[entry.id]"
      :layout="options.layout"
      :modelsSectionLabel="options.modelsSectionLabel">
      <AsyncApiTraversedEntry
        :clientDocument="clientDocument"
        :document="document"
        :entries="entry.children ?? []"
        :eventBus="eventBus"
        :expandedItems="expandedItems"
        :expansion="expansion"
        :level="level + 1"
        :options="options"
        :scrollTargetId="scrollTargetId"
        :specificationExtension="specificationExtension" />
    </ModelTag>

    <Model
      v-else-if="isModel(entry) && schema?.kind === 'schema'"
      :id="entry.id"
      :eventBus="eventBus"
      :expansion="expansion"
      :isCollapsed="!expandedItems[entry.id]"
      :name="entry.name"
      :options="options"
      :schema="
        adaptSchema(componentSchemas?.[entry.name], entry.name) ?? schema.schema
      "
      :scrollTargetId="scrollTargetId"
      :specificationExtension="specificationExtension" />
    <SourceModel
      v-else-if="isModel(entry) && schema?.kind === 'source'"
      :id="entry.id"
      :eventBus="eventBus"
      :format="schema.format"
      :isCollapsed="!expandedItems[entry.id]"
      :layout="options.layout"
      :name="entry.name"
      :value="schema.value" />
  </Lazy>
</template>
