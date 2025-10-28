<script setup lang="ts">
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { HeaderObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import SchemaProperty from '@/components/Content/Schema/SchemaProperty.vue'

const { name, header, breadcrumb } = defineProps<{
  header: HeaderObject
  name: string
  breadcrumb?: string[]
  eventBus: WorkspaceEventBus | null
  orderSchemaPropertiesBy: 'alpha' | 'preserve' | undefined
  orderRequiredPropertiesFirst: boolean | undefined
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
    }"
    :schema="getResolvedRef(header.schema)" />
</template>
