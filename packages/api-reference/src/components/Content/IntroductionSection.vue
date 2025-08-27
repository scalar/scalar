<script setup lang="ts">
import { Lazy } from '@/components/Lazy'
import { useNavState } from '@/hooks/useNavState'

defineProps<{
  showEmptyState: boolean
}>()
const { hash } = useNavState()
</script>
<template>
  <!-- Empty State -->
  <slot
    v-if="showEmptyState"
    name="empty-state" />

  <!-- Introduction -->
  <Lazy
    v-else
    id="introduction-card"
    prev
    :isLazy="Boolean(hash) && !hash.startsWith('description')">
    <slot name="default" />
  </Lazy>
</template>
