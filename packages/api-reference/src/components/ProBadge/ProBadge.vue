<template>
  <Badge
    v-if="showProBadge"
    class="text-orange api-plan-badge">
    API Plan
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { Badge } from '@/components/Badge'

const { operation } = defineProps<{
  operation?: {
    'x-api-plan-only'?: boolean
    [key: string]: any
  }
}>()

/** Only show the PRO badge when x-api-plan-only is explicitly set to "pro" */
const showProBadge = computed(() => {
  return operation?.['x-api-plan-only'] === true
})
</script>

<style scoped>
.api-plan-badge {
  font-weight: var(--scalar-bold);
  font-size: var(--scalar-micro);
}
</style>
