<script setup lang="ts">
import { getDocumentTypeLabel } from '@scalar/workspace-store/schemas/type-guards'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'

const { documentType = 'openapi', version } = defineProps<{
  /** The kind of document being described. Drives the badge label. */
  documentType?: 'openapi' | 'asyncapi'
  /** The original specification version (e.g. "3.1.0" for OpenAPI, "3.0.0" for AsyncAPI). */
  version?: string
}>()

const label = computed(() => getDocumentTypeLabel(documentType))
</script>

<template>
  <Badge v-if="version">{{ label }} {{ version }}</Badge>
</template>
