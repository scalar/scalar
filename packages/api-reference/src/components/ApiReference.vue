<script setup lang="ts">
import { createHead, useSeoMeta } from 'unhead'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

import { useToasts } from '../hooks/useToasts'
import { type ReferenceProps } from '../types'
import CustomToaster from './CustomToaster.vue'
import Layouts from './Layouts/'

const props = defineProps<ReferenceProps>()

defineEmits<{
  (e: 'updateContent', value: string): void
}>()

const content = ref('')

// Configure Reference toasts to use vue-sonner
const { initializeToasts } = useToasts()
initializeToasts((message) => {
  toast(message)
})

// Create the head tag if the configuration has meta data
if (props.configuration?.metaData) {
  createHead()
  useSeoMeta(props.configuration.metaData)
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
  <!-- Initialize the vue-sonner instance -->
  <CustomToaster />
</template>
<style>
body {
  margin: 0;
}
</style>
