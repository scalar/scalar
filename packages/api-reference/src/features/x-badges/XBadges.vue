<script setup lang="ts">
import { XBadgesSchema } from '@scalar/workspace-store/schemas/extensions/x-badge'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { computed } from 'vue'

import { Badge } from '@/components/Badge'

const { position, payload } = defineProps<{
  position: 'before' | 'after'
  payload: object
}>()

const filteredBadges = computed(() => {
  const badges = coerceValue(XBadgesSchema, payload)['x-badges']

  if (Array.isArray(badges)) {
    return badges.filter((badge) => badge.position === position)
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
