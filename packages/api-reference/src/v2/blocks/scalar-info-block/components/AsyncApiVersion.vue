<script setup lang="ts">
import { Badge } from '@/components/Badge'

defineProps<{
  aasVersion?: string
}>()
</script>

<template>
  <Badge v-if="aasVersion">AsyncAPI {{ aasVersion }}</Badge>
</template>
