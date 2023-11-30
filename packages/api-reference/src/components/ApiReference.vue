<script setup lang="ts">
import { createHead, useSeoMeta } from 'unhead'
import { computed, ref } from 'vue'

import { type ReferenceProps, type SpecConfiguration } from '../types'
import Layouts from './Layouts/'

const props = defineProps<ReferenceProps>()

const content = ref('')

// Create a local spec for caching the content if no spec is set
const config = computed(() => {
  const spec: SpecConfiguration = props.configuration?.spec || {
    content: content.value,
  }
  return { ...props.configuration, spec }
})

// Create the head tag if the configuration has meta data
if (config.value?.metaData) {
  createHead()
  useSeoMeta(config.value.metaData)
}
</script>
<template>
  <Component
    :is="Layouts[config.layout || 'modern']"
    :configuration="config"
    @updateContent="content = $event">
    <template #footer><slot name="footer" /></template>
  </Component>
</template>
