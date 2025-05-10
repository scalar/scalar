<script lang="ts" setup>
import { Tab, TabGroup, TabList, TabPanel } from '@headlessui/vue'
import {
  cva,
  cx,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import { ScalarIconCaretDown } from '@scalar/icons'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import { stringify } from 'flatted'
import { computed, nextTick, onMounted, ref } from 'vue'

import { mergeAllOfSchemas } from '@/components/Content/Schema/helpers/merge-all-of-schemas'

import Schema from './Schema.vue'

const { schemas, value, discriminator } = defineProps<{
  discriminator: string
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
  name?: string
  value: Record<string, any>
  level: number
  compact?: boolean
  hideHeading?: boolean
}>()

const selectedIndex = ref(0)

const listboxOptions = computed(() =>
  value[discriminator].map((schema: any, index: number) => ({
    id: String(index),
    label: getModelNameFromSchema(schema) || 'Schema',
  })),
)

const selectedOption = computed({
  get: () =>
    listboxOptions.value.find(
      (opt: ScalarListboxOption) => opt.id === String(selectedIndex.value),
    ),
  set: (opt: ScalarListboxOption) => (selectedIndex.value = Number(opt.id)),
})

// Get model name from schema
const getModelNameFromSchema = (schema: any): string | null => {
  if (!schema) {
    return null
  }

  if (schema.name) {
    return schema.name
  }

  if (schema.title) {
    return schema.title
  }

  // returns a matching schema name based on the schema object
  if (schemas && typeof schemas === 'object') {
    for (const [schemaName, schemaValue] of Object.entries(schemas)) {
      if (stringify(schemaValue) === stringify(schema)) {
        return schemaName
      }
    }
    return Object.keys(schema)[0]
  }

  // Handle array types with items
  if (schema.type === 'array' && schema.items) {
    const itemType = schema.items.type || 'any'
    return `Array of ${itemType}`
  }

  if (schema.type) {
    return schema.type
  }

  if (typeof schema === 'object') {
    const keys = Object.keys(schema)
    if (keys.length > 0) {
      return keys[0]
    }
  }

  return null
}

// Humanizes discriminator type name e.g. oneOf -> One of
const humanizeType = (type: string) => {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .toLowerCase()
    .replace(/^(\w)/, (c) => c.toUpperCase())
}
</script>

<template>
  <div class="property-rule">
    <template v-if="discriminator === 'oneOf' || discriminator === 'anyOf'">
      <!-- Tabs -->
      <ScalarListbox
        v-model="selectedOption"
        :options="listboxOptions"
        resize>
        <button
          class="discriminator-selector bg-b-1.5 hover:bg-b-2 py-1.25 flex cursor-pointer gap-1 rounded-t-lg border border-b-0 px-2 pr-3 text-left"
          type="button">
          <span class="text-c-2">{{ humanizeType(discriminator) }}</span>
          <span class="discriminator-selector-label text-c-1 relative">
            {{ selectedOption?.label || 'Schema' }}
          </span>
          <ScalarIconCaretDown class="z-1" />
        </button>
      </ScalarListbox>
      <div class="discriminator-panel">
        <Schema
          :compact="compact"
          :level="level"
          :hideHeading="hideHeading"
          :name="name"
          :noncollapsible="true"
          :schemas="schemas"
          :value="value[discriminator][selectedIndex]" />
      </div>
    </template>
    <template v-else>
      <Schema
        :compact="compact"
        :level="level"
        :name="name"
        :noncollapsible="level != 0 ? false : true"
        :schemas="schemas"
        :value="mergeAllOfSchemas(value[discriminator])" />
    </template>
  </div>
</template>
