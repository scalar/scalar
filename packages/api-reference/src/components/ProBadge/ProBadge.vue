<template>
  <Badge
    v-if="showProBadge"
    class="text-orange pro-badge">
    PRO
  </Badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { Badge } from '@/components/Badge'

const { operation } = defineProps<{
  operation?: {
    'x-scalar-tier'?: string
    [key: string]: any
  }
}>()

/** Only show the PRO badge when x-scalar-tier is explicitly set to "pro" */
const showProBadge = computed(() => {
  return operation?.['x-scalar-tier'] === 'pro'
})
</script>

<style scoped>
.pro-badge {
  font-weight: var(--scalar-bold);
  font-size: var(--scalar-micro);
}
</style>
