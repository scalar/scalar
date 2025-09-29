<script setup lang="ts">
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { HeaderObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import SchemaProperty from '@/components/Content/Schema/SchemaProperty.vue'

const { name, header, breadcrumb } = defineProps<{
  header: HeaderObject
  name: string
  breadcrumb?: string[]
  config: ApiReferenceConfiguration
}>()
</script>
<template>
  <SchemaProperty
    v-if="'schema' in header && header.schema"
    :breadcrumb="breadcrumb ? [...breadcrumb, 'headers'] : undefined"
    :description="header.description"
    :name="name"
    :options="{
      orderRequiredPropertiesFirst: config.orderRequiredPropertiesFirst,
      orderSchemaPropertiesBy: config.orderSchemaPropertiesBy,
    }"
    :schema="getResolvedRef(header.schema)" />
</template>
