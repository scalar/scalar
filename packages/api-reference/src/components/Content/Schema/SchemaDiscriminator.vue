<script lang="ts" setup>
import { Tab, TabGroup, TabList, TabPanel } from '@headlessui/vue'
import { cva, cx } from '@scalar/components'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import { stringify } from 'flatted'
import { ref } from 'vue'

import Schema from './Schema.vue'

const props = defineProps<{
  discriminator: string
  schemas?:
    | OpenAPIV2.DefinitionsObject
    | Record<string, OpenAPIV3.SchemaObject>
    | Record<string, OpenAPIV3_1.SchemaObject>
    | unknown
  value: Record<string, any>
  level: number
  compact?: boolean
  hideHeading?: boolean
}>()

const selectedOneOfIndex = ref(0)

const buttonVariants = cva({
  base: 'py-0.75 h-fit rounded-full border px-2 text-sm font-medium transition-colors',
  variants: {
    selected: {
      true: 'bg-b-accent text-c-accent hover:text-c-accent',
      false: 'bg-transparent text-c-2 hover:text-c-1',
    },
  },
})

// Function to merge allOf schemas
const mergeAllOfSchemas = (schemas: any[]) => {
  if (!Array.isArray(schemas) || schemas.length === 0) {
    return {}
  }

  // Handle case where we have an array of objects with allOf properties
  if (schemas.length > 0 && schemas[0].allOf) {
    const allSchemas = schemas.flatMap((schema) => schema.allOf || [])
    return mergeAllOfSchemas(allSchemas)
  }

  // Regular case - just merge the schemas directly
  return schemas.reduce((result, schema) => {
    if (!schema || typeof schema !== 'object') {
      return result
    }

    const mergedResult = { ...result }

    if (schema.properties) {
      mergedResult.properties = {
        ...mergedResult.properties,
        ...schema.properties,
      }
    }

    if (schema.required && Array.isArray(schema.required)) {
      mergedResult.required = [
        ...(mergedResult.required || []),
        ...schema.required,
      ]
    }

    if (schema.type && !mergedResult.type) {
      mergedResult.type = schema.type
    }

    if (schema.description && !mergedResult.description) {
      mergedResult.description = schema.description
    }

    return mergedResult
  }, {})
}

// Get model name from schema
const getModelNameFromSchema = (schema: any): string | null => {
  if (!schema) return null

  // returns a matching schema name based on the schema object
  if (props.schemas && typeof props.schemas === 'object') {
    for (const [schemaName, schemaValue] of Object.entries(props.schemas)) {
      if (stringify(schemaValue) === stringify(schema)) {
        return schemaName
      }
    }
    return Object.keys(schema)[0]
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
      <TabGroup>
        <TabList
          class="discriminator-tab-list py-1.25 flex items-center gap-2 rounded-t-lg border border-b-0 px-2 pr-3">
          <span>{{ humanizeType(discriminator) }}</span>
          <div class="flex items-center gap-1.5 overflow-x-auto">
            <Tab
              v-for="(schema, index) in value[discriminator]"
              :key="index"
              @click="selectedOneOfIndex = index"
              class="cursor-pointer"
              :class="
                cx(buttonVariants({ selected: selectedOneOfIndex === index }))
              ">
              {{ getModelNameFromSchema(schema) || 'Schema' }}
            </Tab>
          </div>
        </TabList>
        <TabPanel
          v-for="(schema, index) in value[discriminator]"
          :key="index"
          class="discriminator-panel">
          <Schema
            :compact="compact"
            :noncollapsible="true"
            :schemas="schemas"
            :value="schema"
            :hideHeading="hideHeading" />
        </TabPanel>
      </TabGroup>
    </template>
    <template v-else>
      <Schema
        :compact="compact"
        :noncollapsible="level != 0 ? false : true"
        :schemas="schemas"
        :level="level"
        :value="mergeAllOfSchemas(value[discriminator])" />
    </template>
  </div>
</template>
<style scoped>
.discriminator-panel:has(.property--compact) {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-bottom-left-radius: var(--scalar-radius-lg);
  border-bottom-right-radius: var(--scalar-radius-lg);
}
.discriminator-panel :deep(.schema-properties .schema-properties-open) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
.discriminator-panel :deep(.property--level-0),
.discriminator-panel :deep(.property--compact.property--level-1) {
  padding: 8px;
}
.discriminator-panel :deep(.property--compact.property--level-0) {
  padding: 0;
}
</style>
