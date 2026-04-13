<script setup lang="ts">
import { json2xml } from '@scalar/helpers/file/json2xml'
import { computed } from 'vue'

const { xml = false, modelValue } = defineProps<{
  xml?: boolean
  modelValue: unknown
}>()

const xmlContent = computed(() =>
  json2xml(modelValue as Record<string, unknown>),
)
</script>
<template>
  <template v-if="xml">
    <pre><code class="language-xml">{{ xmlContent }}</code></pre>
  </template>
  <template v-else>
    <pre><code class="language-json">{{ JSON.stringify(modelValue, null, 2) }}</code></pre>
  </template>
</template>
