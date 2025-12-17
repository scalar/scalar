<script setup lang="ts">
import { ExamplePicker } from '@scalar/api-client/v2/blocks/operation-code-sample'
import {
  ScalarCard,
  ScalarCardFooter,
  ScalarCardSection,
  ScalarCodeBlock,
} from '@scalar/components'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, ref } from 'vue'

const { schema } = defineProps<{ schema: SchemaObject }>()

/** Grab the examples for the schema object */
const examples = computed<Record<string, string>>(() => {
  const base: Record<string, string> = {}

  // x-examples extension
  if (schema['x-examples']) {
    Object.entries(schema['x-examples']).forEach(([key, value]) => {
      base[key] =
        typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : String(value)
    })
  }

  // Regular schema examples array
  if (schema.examples) {
    schema.examples.forEach((value, index) => {
      base[`Example ${index + 1}`] =
        typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : String(value)
    })
  }

  return base
})

/** The currently selected example key */
const selectedExampleKey = ref<string>(Object.keys(examples.value)[0] ?? '')
</script>
<template>
  <ScalarCard
    v-if="Object.keys(examples).length > 0"
    class="dark-mode">
    <!-- Code snippet -->
    <ScalarCardSection>
      <div class="code-snippet">
        <ScalarCodeBlock
          class="bg-b-2"
          lang="json"
          lineNumbers
          :prettyPrintedContent="
            examples[selectedExampleKey] ??
            'There was an error loading the example'
          " />
      </div>
    </ScalarCardSection>

    <!-- Example picker -->
    <ScalarCardFooter
      v-if="Object.keys(examples).length > 1"
      class="bg-b-3">
      <ExamplePicker
        v-model="selectedExampleKey"
        :examples />
    </ScalarCardFooter>
  </ScalarCard>
</template>
