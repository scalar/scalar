<script setup lang="ts">
import {
  getHttpMethodInfo,
  type REQUEST_METHODS,
} from '@scalar/helpers/http/http-info'
import { computed } from 'vue'

const props = defineProps<{
  method: keyof typeof REQUEST_METHODS
  name: string
}>()

const methodInfo = computed(() => getHttpMethodInfo(props.method))
</script>

<template>
  <div
    :class="`font-code inline-flex items-center gap-2 rounded px-2.5 py-1.5 text-sm font-medium whitespace-nowrap ${methodInfo.colorClass} ${methodInfo.backgroundColor}`">
    <div class="text-xs">{{ methodInfo.short }}</div>
    <div>{{ name }}</div>
  </div>
</template>
