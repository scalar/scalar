<script setup lang="ts">
import { computed } from 'vue'

const { color } = defineProps<{
  color?: string
}>()

const badgeStyle = computed(() =>
  color
    ? {
        '--badge-background-color': color,
        '--badge-text-color': `color-mix(in srgb, ${color}, black 40%)`,
      }
    : {},
)
</script>

<template>
  <div
    class="badge"
    :style="badgeStyle">
    <slot />
  </div>
</template>

<style scoped>
.badge {
  color: var(--badge-text-color, var(--scalar-color-2));
  font-size: var(--scalar-mini);
  background: var(--badge-background-color, var(--scalar-background-2));
  border: var(--scalar-border-width) solid
    var(--badge-border-color, var(--scalar-border-color));
  padding: 2px 6px;
  border-radius: 12px;
  display: inline-block;
}
.badge.text-orange {
  background: color-mix(in srgb, var(--scalar-color-orange), transparent 90%);
  border: transparent;
}
.badge.text-yellow {
  background: color-mix(in srgb, var(--scalar-color-yellow), transparent 90%);
  border: transparent;
}
.badge.text-red {
  background: color-mix(in srgb, var(--scalar-color-red), transparent 90%);
  border: transparent;
}
.badge.text-purple {
  background: color-mix(in srgb, var(--scalar-color-purple), transparent 90%);
  border: transparent;
}
.badge.text-green {
  background: color-mix(in srgb, var(--scalar-color-green), transparent 90%);
  border: transparent;
}
</style>
