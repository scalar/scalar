<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  HeaderObject,
  OpenApiDocument,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import SchemaProperty from '@/components/Content/Schema/SchemaProperty.vue'

const {
  name,
  header,
  breadcrumb,
  document,
  orderSchemaPropertiesBy,
  orderRequiredPropertiesFirst,
  expandAllSchemaProperties,
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
  /** Whether the models section is hidden, so model names render as plain text instead of links */
  hideModels: boolean | undefined
}>()
</script>
<template>
  <SchemaProperty
    v-if="'schema' in header && header.schema"
    :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
    :description="header.description"
    :eventBus="eventBus"
    :name="name"
    :options="{
      orderRequiredPropertiesFirst: orderRequiredPropertiesFirst,
      orderSchemaPropertiesBy: orderSchemaPropertiesBy,
      expandAllSchemaProperties: expandAllSchemaProperties,
      hideModels: hideModels,
      document,
    }"
    :schema="getResolvedRef(header.schema)" />
</template>
