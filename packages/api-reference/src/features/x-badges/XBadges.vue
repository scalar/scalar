<script setup lang="ts">
import { ScalarBadge } from '@scalar/components/badge'
import type { XBadge } from '@scalar/workspace-store/schemas/extensions/operation'
import { computed } from 'vue'

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
  <template v-if="filteredBadges.length">
    <template
      v-for="badge in filteredBadges"
      :key="badge.name">
      <ScalarBadge :color="badge.color">
        {{ badge.name }}
      </ScalarBadge>
    </template>
  </template>
</template>
