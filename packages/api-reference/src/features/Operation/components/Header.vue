<script setup lang="ts">
import { SchemaProperty } from '@scalar/blocks/schema'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  HeaderObject,
  OpenApiDocument,
} from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { computed } from 'vue'

const {
  name,
  header,
  breadcrumb,
  document,
  orderSchemaPropertiesBy,
  orderRequiredPropertiesFirst,
  expandAllSchemaProperties,
  schemaKeyboardNav,
  showExtensions,
  hideModels,
  hideModelNames,
} = defineProps<{
  header: HeaderObject
  name: string
  /** The anchor path of the headers group; `Headers.vue` has already appended the `headers` segment */
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  /** The document the header belongs to, used to resolve schema references for display */
  document?: OpenApiDocument
  orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  orderRequiredPropertiesFirst: boolean | undefined
  expandAllSchemaProperties: boolean | undefined
  /** Whether arrow-key navigation is enabled */
  schemaKeyboardNav: boolean | undefined
  /** Selected extensions to display on the header and its schema. */
  showExtensions?: string[]
  /** Whether the models section is hidden, so model names render as plain text instead of links */
  hideModels: boolean | undefined
  /** Show structural types in schema labels */
  hideModelNames?: boolean
}>()
/** Headers may describe their value with either schema or a single media type. */
const schema = computed(() => {
  if ('schema' in header && header.schema) {
    return getResolvedRef(header.schema)
  }
  if ('content' in header && header.content) {
    return getResolvedRef(Object.values(header.content)[0]?.schema)
  }
  return undefined
})
</script>
<template>
  <SchemaProperty
    :breadcrumb="breadcrumb"
    :description="header.description"
    :eventBus="eventBus"
    :extensionSource="header"
    :name="name"
    :options="{
      orderRequiredPropertiesFirst: orderRequiredPropertiesFirst,
      orderSchemaPropertiesBy: orderSchemaPropertiesBy,
      expandAllSchemaProperties: expandAllSchemaProperties,
      schemaKeyboardNav: schemaKeyboardNav,
      showExtensions,
      hideModels: hideModels,
      hideModelNames,
      document,
    }"
    :schema="schema" />
</template>
