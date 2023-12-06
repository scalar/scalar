<script setup lang="ts">
import { createHead, useSeoMeta } from 'unhead'
import { computed, ref } from 'vue'

import { useNavigate } from '../hooks'
import { type ReferenceProps, type SpecConfiguration } from '../types'
import Layouts from './Layouts/'

const props = defineProps<ReferenceProps>()

defineEmits<{
  (e: 'updateContent', value: string): void
}>()

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

const { navState } = useNavigate()
console.log(navState)

function handleUpdateContent(value: string) {
  content.value = value
  props.configuration?.onSpecUpdate?.(value)
}
</script>
<template>
  <Component
    :is="Layouts[config.layout || 'modern']"
    :configuration="config"
    @updateContent="handleUpdateContent">
    <template #footer><slot name="footer" /></template>
  </Component>
</template>
