<script setup lang="ts">
import { computed } from 'vue'

import { Badge } from '@/components/Badge'

const { documentType = 'openapi', version } = defineProps<{
  /** The kind of document being described. Drives the badge label. */
  documentType?: 'openapi' | 'asyncapi'
  /** The original specification version (e.g. "3.1.0" for OpenAPI, "3.0.0" for AsyncAPI). */
  version?: string
}>()

const label = computed(() =>
  documentType === 'asyncapi' ? 'AsyncAPI' : 'OpenAPI',
)
</script>

<template>
  <Badge v-if="version">{{ label }} {{ version }}</Badge>
</template>
