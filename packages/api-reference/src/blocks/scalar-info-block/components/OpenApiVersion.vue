<script setup lang="ts">
import { Badge } from '@/components/Badge'

defineProps<{
  oasVersion?: string
}>()
</script>

<template>
  <Badge v-if="oasVersion">OAS {{ oasVersion }}</Badge>
</template>
