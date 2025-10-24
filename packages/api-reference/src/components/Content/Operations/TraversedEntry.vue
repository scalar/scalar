<script setup lang="ts">
import type { ClientOptionGroup } from '@scalar/api-client/v2/blocks/operation-code-sample'
import type { Server } from '@scalar/oas-utils/entities/spec'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  TraversedEntry,
  TraversedModels,
  TraversedOperation,
  TraversedSchema,
  TraversedTag,
  TraversedWebhook,
} from '@scalar/workspace-store/schemas/navigation'
import type {
  ComponentsObject,
  PathsObject,
  SecurityRequirementObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import Model from '@/components/Content/Models/Model.vue'
import ModelTag from '@/components/Content/Models/ModelTag.vue'
import { Tag } from '@/components/Content/Tags'
import Lazy from '@/components/Lazy/Lazy.vue'
import { SectionContainer } from '@/components/Section'
import { Operation } from '@/features/Operation'
import type { SecuritySchemeGetter } from '@/v2/helpers/map-config-to-client-store'

const {
  level = 0,
  entries,
  paths,
  webhooks,
  security,
} = defineProps<{
  level?: number
  entries: TraversedEntry[]
  /** The path entries from the document `document.paths` */
  paths: PathsObject
  /** The webhook path entries from the document `document.webhooks` */
  webhooks: PathsObject
  /** The schema entries from the document `document.components.schemas` */
  schemas: ComponentsObject['schemas']
  /** The security requirements from the document `document.security` */
  security: SecurityRequirementObject[] | undefined
  activeServer: Server | undefined
  getSecuritySchemes: SecuritySchemeGetter
  xScalarDefaultClient: WorkspaceStore['workspace']['x-scalar-default-client']
  /** Used to determine if an entry is collapsed */
  expandedItems: Record<string, boolean>
  options: {
    layout: 'classic' | 'modern'
    showOperationId: boolean | undefined
    hideTestRequestButton: boolean | undefined
    expandAllResponses: boolean | undefined
    expandAllModelSections: boolean | undefined
    clientOptions: ClientOptionGroup[]
    orderRequiredPropertiesFirst: boolean | undefined
    orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  }
}>()

const emit = defineEmits<{
  (e: 'toggleTag', id: string, open: boolean): void
  (e: 'scrollToId', id: string): void
  (e: 'intersecting', id: string): void
  (e: 'toggleSchema', id: string, open: boolean): void
  (e: 'toggleOperation', id: string, open: boolean): void
  (e: 'copyAnchorUrl', id: string): void
  (e: 'intersecting', id: string): void
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
  return isWebhook(entry) ? webhooks[entry.name] : paths[entry.path]
}
</script>

<template>
  <!-- The key must be joined with the layout to force a re-render when the layout changes -->
  <!-- Without this we get a timing issue where the lazy bus is reset and the element is not rendered -->
  <Lazy
    v-for="entry in entries"
    :id="entry.id"
    :key="`${entry.id}-${options.layout}`">
    <!-- Operation or Webhook -->
    <SectionContainer
      v-if="isOperation(entry) || isWebhook(entry)"
      :omit="level !== 0">
      <Operation
        :id="entry.id"
        :getSecurityScheme="getSecuritySchemes"
        :isCollapsed="!expandedItems[entry.id]"
        :method="entry.method"
        :options="{
          ...options,
          isWebhook: isWebhook(entry),
        }"
        :path="isWebhook(entry) ? entry.name : entry.path"
        :pathValue="getPathValue(entry)"
        :security="security"
        :server="activeServer"
        :xScalarDefaultClient="xScalarDefaultClient"
        @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
        @intersecting="(id) => emit('intersecting', id)"
        @toggleOperation="(id, open) => emit('toggleOperation', id, open)" />
    </SectionContainer>

    <!-- Webhook Group or Tag -->
    <Tag
      v-else-if="isTag(entry)"
      :isCollapsed="!expandedItems[entry.id]"
      :isLoading="false"
      :layout="options.layout"
      :moreThanOneTag="entries.filter(isTag).length > 1"
      :tag="entry"
      @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
      @intersecting="(id) => emit('intersecting', id)"
      @scrollToId="(id) => emit('scrollToId', id)"
      @toggleTag="(id, open) => emit('toggleTag', id, open)">
      <template v-if="'children' in entry && entry.children?.length">
        <TraversedEntry
          :activeServer
          :entries="entry.children"
          :expandedItems="expandedItems"
          :getSecuritySchemes="getSecuritySchemes"
          :level="level + 1"
          :options
          :paths="paths"
          :schemas="schemas"
          :security="security"
          :webhooks="webhooks"
          :xScalarDefaultClient="xScalarDefaultClient"
          @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
          @intersecting="(id) => emit('intersecting', id)"
          @scrollToId="(id) => emit('scrollToId', id)"
          @toggleOperation="(id, open) => emit('toggleOperation', id, open)"
          @toggleSchema="(id, open) => emit('toggleSchema', id, open)"
          @toggleTag="(id, open) => emit('toggleTag', id, open)">
        </TraversedEntry>
      </template>
    </Tag>

    <!-- Tag Group -->
    <TraversedEntry
      v-else-if="isTagGroup(entry)"
      :activeServer
      :entries="entry.children || []"
      :expandedItems="expandedItems"
      :getSecuritySchemes="getSecuritySchemes"
      :level="level + 1"
      :options
      :paths="paths"
      :schemas="schemas"
      :security="security"
      :webhooks="webhooks"
      :xScalarDefaultClient="xScalarDefaultClient"
      @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
      @intersecting="(id) => emit('intersecting', id)"
      @scrollToId="(id) => emit('scrollToId', id)"
      @toggleOperation="(id, open) => emit('toggleOperation', id, open)"
      @toggleSchema="(id, open) => emit('toggleSchema', id, open)"
      @toggleTag="(id, open) => emit('toggleTag', id, open)">
    </TraversedEntry>

    <!-- Models -->
    <ModelTag
      v-else-if="isModelsTag(entry) && schemas"
      :id="entry.id"
      :isCollapsed="!expandedItems[entry.id]"
      :options="{
        layout: options.layout,
        expandAllModelSections: options.expandAllModelSections,
        orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
        orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
      }"
      @intersecting="(id) => emit('intersecting', id)"
      @toggleTag="(id, open) => emit('toggleTag', id, open)">
      <TraversedEntry
        :activeServer
        :entries="entry.children || []"
        :expandedItems="expandedItems"
        :getSecuritySchemes="getSecuritySchemes"
        :level="level + 1"
        :options
        :paths="paths"
        :schemas="schemas"
        :security="security"
        :webhooks="webhooks"
        :xScalarDefaultClient="xScalarDefaultClient"
        @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
        @intersecting="(id) => emit('intersecting', id)"
        @scrollToId="(id) => emit('scrollToId', id)"
        @toggleOperation="(id, open) => emit('toggleOperation', id, open)"
        @toggleSchema="(id, open) => emit('toggleSchema', id, open)"
        @toggleTag="(id, open) => emit('toggleTag', id, open)">
      </TraversedEntry>
    </ModelTag>

    <Model
      v-else-if="isModel(entry) && schemas"
      :id="entry.id"
      :isCollapsed="!expandedItems[entry.id]"
      :name="entry.name"
      :options="{
        layout: options.layout,
        orderRequiredPropertiesFirst: options.orderRequiredPropertiesFirst,
        orderSchemaPropertiesBy: options.orderSchemaPropertiesBy,
      }"
      :schema="getResolvedRef(schemas[entry.name])"
      @copyAnchorUrl="(id) => emit('copyAnchorUrl', id)"
      @intersecting="(id) => emit('intersecting', id)"
      @toggleSchema="(id, open) => emit('toggleSchema', id, open)">
    </Model>
  </Lazy>
</template>
