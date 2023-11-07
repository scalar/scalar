<script setup lang="ts">
import { computed } from 'vue'

import { splitMarkdownInSections } from '../../../helpers'
import MarkdownRenderer from '../MarkdownRenderer.vue'

const props = defineProps<{
  value: string
}>()

const sections = computed(() => {
  return splitMarkdownInSections(props.value)
})
</script>
<template>
  <div
    v-for="(section, index) in sections"
    :key="index">
    <MarkdownRenderer :value="section" />
  </div>
</template>
