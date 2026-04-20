<script setup lang="ts">
import { computed, type Component } from 'vue'

const { is = 'div', color } = defineProps<{
  is?: Component | string
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
  <component
    :is
    class="badge"
    :style="badgeStyle"
    :type="is === 'button' ? 'button' : undefined">
    <slot />
  </component>
</template>

<style scoped>
.badge {
  color: var(--badge-text-color, var(--scalar-color-2));
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-font-medium);
  background: var(--badge-background-color, var(--scalar-background-2));
  border: var(--scalar-border-width) solid
    var(--badge-border-color, var(--scalar-border-color));
  padding: 3px 8px;
  border-radius: 12px;
  display: inline-block;
}
button.badge:hover {
  background: color-mix(
    in srgb,
    var(--badge-background-color, var(--scalar-background-2)),
    var(--badge-text-color, var(--scalar-color-2)) 5%
  );
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
