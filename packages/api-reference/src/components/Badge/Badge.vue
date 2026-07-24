<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

const { color } = defineProps<{
  color?: string
}>()

// Merge fallthrough classes via `cx` so consumer classes can override the base styles.
defineOptions({ inheritAttrs: false })

const { cx } = useBindCx()

const badgeStyle = computed(() =>
  color
    ? {
        backgroundColor: color,
        color: `color-mix(in srgb, ${color}, black 40%)`,
      }
    : undefined,
)
</script>

<template>
  <div
    v-bind="
      cx(
        'badge inline-block rounded-2xl border bg-b-2 px-1.5 py-0.5 text-c-2 text-sm',
      )
    "
    :style="badgeStyle">
    <slot />
  </div>
</template>

<style scoped>
/* Colour variants are keyed on the `text-*` class a consumer passes in. */
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
