<script setup lang="ts">
import { computed } from 'vue'

import {
  getHeadingsFromMarkdown,
  splitMarkdownInSections,
} from '../../../helpers'
import MarkdownRenderer from '../MarkdownRenderer.vue'

const props = defineProps<{
  value: string
}>()

const sections = computed(() => {
  // TODO: Find highest heading level
  return splitMarkdownInSections(props.value)
})

// TODO: This is async, how do we deal with this?
// We need the heading ids to pass them to the IntersectionObserver
// getHeadingsFromMarkdown(section)
</script>
<template>
  <div
    v-for="(section, index) in sections"
    :key="index">
    <MarkdownRenderer :value="section" />
  </div>
</template>
