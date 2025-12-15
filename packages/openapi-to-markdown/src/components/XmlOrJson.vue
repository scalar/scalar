<script setup lang="ts">
import { json2xml } from '@scalar/helpers/file/json2xml'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { isSchemaObject } from '@scalar/openapi-types/helpers'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    xml?: boolean
    modelValue: OpenAPIV3_1.SchemaObject
  }>(),
  {
    xml: false,
  },
)

/**
 * Computed property that returns the modelValue if it's an object, or null otherwise.
 * json2xml requires a Record<string, any>, not a boolean.
 */
const modelValueObject = computed(() => {
  return isSchemaObject(props.modelValue) ? props.modelValue : null
})
</script>
<template>
  <template v-if="modelValueObject">
    <template v-if="xml">
      <pre><code class="language-xml">{{ json2xml(modelValueObject) }}</code></pre>
    </template>
    <template v-else>
      <pre><code class="language-json">{{ JSON.stringify(modelValueObject, null, 2) }}</code></pre>
    </template>
  </template>
</template>
