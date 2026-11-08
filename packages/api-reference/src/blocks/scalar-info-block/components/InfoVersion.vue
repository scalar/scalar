<script setup lang="ts">
import type { InfoObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'

import { Badge } from '@/components/Badge'

const { version } = defineProps<{
  version: InfoObject['version']
}>()
</script>
<template>
  <Badge v-if="version != null && version !== ''">{{ version }}</Badge>
</template>
