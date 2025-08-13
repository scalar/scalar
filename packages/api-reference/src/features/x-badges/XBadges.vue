<script setup lang="ts">
import type { XBadge } from '@scalar/workspace-store/schemas/extensions/operation/x-badge'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'

const { position, badges } = defineProps<{
  position: 'before' | 'after'
  badges: XBadge[] | unknown
}>()

const filteredBadges = computed<XBadge[]>(() => {
  if (Array.isArray(badges)) {
    return badges.filter(
      (badge) =>
        badge.position === position ||
        (position === 'after' && !badge.position),
    )
  }

  return []
})
</script>

<template>
  <template
    v-if="filteredBadges.length"
    v-for="badge in filteredBadges"
    :key="badge.name">
    <Badge :color="badge.color">
      {{ badge.name }}
    </Badge>
  </template>
</template>
