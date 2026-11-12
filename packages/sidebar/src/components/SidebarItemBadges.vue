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
    class="sidebar-badge"
    :class="[
      `sidebar-badge-${position}`,
      { 'sidebar-badge-colored': Boolean(badge.color) },
    ]"
    :style="badge.color ? { '--badge-color': badge.color } : undefined">
    {{ badge.name }}
  </span>
</template>

<style scoped>
.sidebar-badge {
  display: inline-block;
  padding: 0 5px;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: 9999px;
  background: var(--scalar-background-2);
  color: var(--scalar-color-2);
  font-size: 10px;
  font-weight: var(--scalar-semibold);
  line-height: 14px;
  white-space: nowrap;
  vertical-align: 1px;
}

.sidebar-badge-before {
  margin-inline-end: 4px;
}

.sidebar-badge-after {
  margin-inline-start: 4px;
}

.sidebar-badge.sidebar-badge-colored {
  border-color: transparent;
  background-color: var(--badge-color);
  /* Fallback for browsers without relative color syntax, same as the badges in the content */
  color: color-mix(in srgb, var(--badge-color), black 40%);
}

/* Black text on a light background, white on a dark one, same as the badges in the content */
@supports (color: lch(from red calc((50 - l) * infinity) 0 0)) {
  .sidebar-badge.sidebar-badge-colored {
    color: lch(from var(--badge-color) calc((50 - l) * infinity) 0 0 / 1);
  }
}
</style>
