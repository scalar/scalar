<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  HeaderObject,
  OpenApiDocument,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import SchemaProperty from '@/components/Content/Schema/SchemaProperty.vue'

const {
  name,
  header,
  breadcrumb,
  document,
  orderSchemaPropertiesBy,
  orderRequiredPropertiesFirst,
  expandAllSchemaProperties,
  schemaLayout,
  schemaKeyboardNav,
  hideModels,
} = defineProps<{
  header: HeaderObject
  name: string
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  /** The document the header belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  orderRequiredPropertiesFirst: boolean | undefined
  expandAllSchemaProperties: boolean | undefined
  schemaLayout: 'legacy' | 'tree' | undefined
  /** Whether arrow-key navigation is enabled (tree layout) */
  schemaKeyboardNav: boolean | undefined
  /** Whether the models section is hidden, so model names render as plain text instead of links */
  hideModels: boolean | undefined
}>()

/**
 * `Headers.vue` already appended the `headers` segment, so appending it again
 * doubles the anchor path to `headers.headers`. The tree drops the duplicate,
 * but the legacy layout keeps it: those ids are what readers have bookmarked
 * since before this layout existed, and legacy anchors must not move.
 */
const headerBreadcrumb = computed((): string[] | undefined =>
  schemaLayout === 'tree' || !breadcrumb
    ? breadcrumb
    : [...breadcrumb, 'headers'],
)
</script>
<template>
  <SchemaProperty
    v-if="'schema' in header && header.schema"
    :breadcrumb="headerBreadcrumb"
    :description="header.description"
    :eventBus="eventBus"
    :name="name"
    :options="{
      orderRequiredPropertiesFirst: orderRequiredPropertiesFirst,
      orderSchemaPropertiesBy: orderSchemaPropertiesBy,
      expandAllSchemaProperties: expandAllSchemaProperties,
      schemaLayout: schemaLayout,
      schemaKeyboardNav: schemaKeyboardNav,
      hideModels: hideModels,
      document,
    }"
    :schema="getResolvedRef(header.schema)" />
</template>
