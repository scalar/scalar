<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { computed } from 'vue'

import {
  getMarkdownExamples,
  type ExampleSource,
} from '../helpers/get-markdown-examples'
import XmlOrJson from './XmlOrJson.vue'

const {
  source,
  mediaType = 'application/json',
  mode,
} = defineProps<{
  source: ExampleSource
  mediaType?: string
  mode?: 'read' | 'write'
}>()

const examples = computed(() => getMarkdownExamples(source, mediaType, mode))
</script>

<template>
  <section
    v-for="(example, index) in examples"
    :key="example.name ?? index">
    <p>
      <strong
        >Example<template v-if="example.name">: {{ example.name }}</template
        ><template v-else>:</template></strong
      >
    </p>
    <p v-if="example.summary">{{ example.summary }}</p>
    <ScalarMarkdown
      v-if="example.description"
      :value="example.description" />
    <p v-if="'externalValue' in example">
      <strong>External value:</strong>
      <a :href="example.externalValue">{{ example.externalValue }}</a>
    </p>
    <XmlOrJson
      v-else
      :modelValue="example.value"
      :xml="mediaType.includes('xml')" />
  </section>
</template>
