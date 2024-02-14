<script setup lang="ts">
import { createHead, useSeoMeta } from 'unhead'
import { ref } from 'vue'

import { type ReferenceProps } from '../types'
import Layouts from './Layouts/'

const props = defineProps<ReferenceProps>()

defineEmits<{
  (e: 'updateContent', value: string): void
}>()

const content = ref('')

// Create the head tag if the configuration has meta data
if (props.configuration?.metaData) {
  createHead()
  useSeoMeta(props.configuration.metaData)
}

// Deprecation warning for isEditable
if (typeof props.configuration?.isEditable !== 'undefined') {
  console.warn(
    'The `isEditable` prop is deprecated and will be removed soon. Use `@scalar/api-reference-editor` if you’d like to edit your OpenAPI files in the browser.',
  )
}

function handleUpdateContent(value: string) {
  content.value = value
  props.configuration?.onSpecUpdate?.(value)
}
</script>
<template>
  <Component
    :is="Layouts[configuration?.layout || 'modern']"
    :configuration="configuration"
    @updateContent="handleUpdateContent">
    <template #footer><slot name="footer" /></template>
  </Component>
</template>
