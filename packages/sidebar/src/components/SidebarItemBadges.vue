<script setup lang="ts">
import type { XBadge } from '@scalar/workspace-store/schemas/extensions/operation'
import { computed } from 'vue'

const { badges, position } = defineProps<{
  /** Badges from the `x-badges` extension of the sidebar item */
  badges: XBadge[]
  /** Which badges to render: the ones before or after the title */
  position: 'before' | 'after'
}>()

/** Badges without a position render after the title, like in the content */
const filteredBadges = computed(() =>
  badges.filter((badge) => (badge.position ?? 'after') === position),
)
</script>

<template>
  <span
    v-for="(badge, index) in filteredBadges"
    :key="`${index}-${badge.name}`"
    class="sidebar-badge inline-block rounded-full border px-[5px] align-[1px] text-[10px] leading-[14px] font-semibold whitespace-nowrap"
    :class="[
      position === 'before' ? 'me-1' : 'ms-1',
      badge.color
        ? 'text-auto-contrast-(--badge-color) border-transparent bg-(--badge-color)'
        : 'bg-b-2 text-c-2',
    ]"
    :style="badge.color ? { '--badge-color': badge.color } : undefined">
    {{ badge.name }}
  </span>
</template>
