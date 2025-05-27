<script setup lang="ts">
import { REQUEST_METHODS } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

const props = defineProps<{
  method: keyof typeof REQUEST_METHODS
  name: string
}>()

const requestMethod = computed(() => {
  return REQUEST_METHODS[props.method]
})
</script>

<template>
  <div
    :class="`font-code inline-flex items-center gap-2 rounded px-2.5 py-1.5 text-sm font-medium whitespace-nowrap ${requestMethod.color} ${requestMethod.backgroundColor}`">
    <div class="text-xs">{{ requestMethod.short }}</div>
    <div>{{ name }}</div>
  </div>
</template>
