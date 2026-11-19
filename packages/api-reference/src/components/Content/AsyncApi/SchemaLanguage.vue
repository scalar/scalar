<script setup lang="ts">
import { Schema, type SchemaOptions } from '@scalar/blocks/schema'
import { useAsyncApiSchemaResources } from '@scalar/workspace-store/helpers/use-async-api-schema-resources'
import { computed } from 'vue'
import type { AsyncApiSchemaResources } from '@scalar/workspace-store/helpers/async-api-schema-resources/resources'

import { readSchema } from '@/helpers/asyncapi-schema/read-schema'
import { toDisplaySchema } from '@/helpers/asyncapi-schema/to-display-schema'
import type { SchemaDocument } from '@/helpers/asyncapi-schema/types'

import SchemaSource from './SchemaSource.vue'

const {
  value,
  format,
  resources,
  headers = false,
  options = {},
} = defineProps<{
  value: unknown
  format: string
  resources?: AsyncApiSchemaResources
  headers?: boolean
  options?: SchemaOptions
}>()
const loadedResources = useAsyncApiSchemaResources(() => ({
  format,
  value,
  resources,
}))
const document = computed<SchemaDocument | undefined>(() => {
  const result = readSchema(format, value, loadedResources.value)
  return headers &&
    !result?.nodes.some((node) =>
      /^(object$|map$|record |message )/.test(node.type),
    )
    ? undefined
    : result
})
const schemas = computed(() =>
  document.value?.nodes.map((node) => ({
    name: node.name,
    schema: toDisplaySchema(node),
  })),
)
const schemaOptions = computed<SchemaOptions>(() =>
  document.value?.nodes.some((node) => node.type.startsWith('message '))
    ? {
        ...options,
        orderSchemaPropertiesBy: 'preserve',
        orderRequiredPropertiesFirst: false,
      }
    : options,
)
</script>

<template>
  <div
    v-if="schemas"
    class="min-w-0">
    <Schema
      v-for="(entry, index) in schemas"
      :key="index"
      compact
      :eventBus="null"
      :hideHeading="schemas.length === 1"
      :name="entry.name"
      noncollapsible
      :options="schemaOptions"
      :schema="entry.schema" />
  </div>
  <SchemaSource
    v-else
    :format="format"
    :value="value" />
</template>
