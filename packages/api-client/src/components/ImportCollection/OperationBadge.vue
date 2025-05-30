<script setup lang="ts">
import { getHttpMethodInfo } from '@scalar/oas-utils/helpers'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed } from 'vue'

const { method } = defineProps<{
  method: OpenAPIV3_1.HttpMethods
  name: string
}>()

/** Grabs the method info object which contains abbreviation, color, and background color etc */
const httpMethodInfo = computed(() => getHttpMethodInfo(method))
</script>

<template>
  <div
    :class="`font-code inline-flex items-center gap-2 rounded px-2.5 py-1.5 text-sm font-medium whitespace-nowrap ${httpMethodInfo.colorClass} ${httpMethodInfo.backgroundColor}`">
    <div class="text-xs">{{ httpMethodInfo.short }}</div>
    <div>{{ name }}</div>
  </div>
</template>
