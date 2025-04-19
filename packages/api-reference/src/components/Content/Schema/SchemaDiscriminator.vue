<script lang="ts" setup>
import { Tab, TabGroup, TabList, TabPanel } from '@headlessui/vue'
import { cva, cx } from '@scalar/components'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import { stringify } from 'flatted'
import { ref } from 'vue'

import { mergeAllOfSchemas } from '@/components/Content/Schema/helpers/merge-all-of-schemas'

import Schema from './Schema.vue'

const props = defineProps<{
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

const selectedOneOfIndex = ref(0)

const buttonVariants = cva({
  base: 'schema-tab',
  variants: {
    selected: {
      true: 'schema-tab-selected',
      false: 'text-c-3',
    },
  },
})

// Get model name from schema
const getModelNameFromSchema = (schema: any): string | null => {
  if (!schema) {
    return null
  }

  if (schema.name) {
    return schema.name
  }

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
          class="discriminator-tab-list py-1.25 flex flex-col gap-1 rounded-t-lg border border-b-0 px-2 pr-3">
          <span class="text-c-3">{{ humanizeType(discriminator) }}</span>
          <div
            class="custom-scroll flex items-center gap-1.5 !overflow-y-hidden">
            <Tab
              v-for="(schema, index) in value[discriminator]"
              :key="index"
              class="cursor-pointer"
              :class="
                cx(buttonVariants({ selected: selectedOneOfIndex === index }))
              "
              @click="selectedOneOfIndex = index">
              <span class="schema-tab-label z-1 relative">
                {{ getModelNameFromSchema(schema) || 'Schema' }}
              </span>
            </Tab>
          </div>
        </TabList>
        <TabPanel
          v-for="(schema, index) in value[discriminator]"
          :key="index"
          class="discriminator-panel">
          <Schema
            :compact="compact"
            :hideHeading="hideHeading"
            :name="name"
            :noncollapsible="true"
            :schemas="schemas"
            :value="schema" />
        </TabPanel>
      </TabGroup>
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
  padding: 8px;
}
.schema-tab {
  background: none;
  border: none;
  font-size: var(--scalar-mini);
  font-family: var(--scalar-font);
  color: var(--scalar-color-2);
  font-weight: var(--scalar-semibold);
  line-height: calc(var(--scalar-mini) + 2px);
  white-space: nowrap;
  cursor: pointer;
  padding: 0;
  position: relative;
  line-height: 1.35;
  position: relative;
}
.schema-tab:before {
  content: '';
  position: absolute;
  z-index: 0;
  left: -4px;
  top: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  border-radius: var(--scalar-radius);
  background: var(--scalar-background-2);
  opacity: 0;
}
.schema-tab:hover:before {
  opacity: 1;
}
.schema-tab-selected {
  color: var(--scalar-color-1);
  text-decoration: underline;
  text-underline-offset: 8px;
}
</style>
