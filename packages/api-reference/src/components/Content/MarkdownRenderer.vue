<script setup lang="ts">
import { parseSwaggerDescription, scalarStyles } from '@scalar/use-markdown'
import { ref, watch } from 'vue'

const props = defineProps<{ value?: string }>()

const html = ref<string>('')

watch(
  () => props.value,
  async () => {
    parseSwaggerDescription(props.value).then((result) => {
      html.value = String(result)
    })
  },
  { immediate: true },
)
</script>

<template>
  <div
    :class="scalarStyles.markdown"
    v-html="html" />
</template>
