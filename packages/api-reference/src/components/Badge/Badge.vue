<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

const { color } = defineProps<{
  color?: string
}>()

// Merge fallthrough classes via `cx` so consumer classes can override the base styles.
defineOptions({ inheritAttrs: false })

const { cx } = useBindCx()

// The color only goes in as a custom property; the text color is derived from
// it in CSS below, where the browser can read lightness out of any color format.
const badgeStyle = computed(() =>
  color ? { '--badge-color': color } : undefined,
)
</script>

<template>
  <div
    v-bind="
      cx(
        'badge inline-block rounded-2xl border bg-b-2 px-1.5 py-0.5 text-c-2 text-sm',
        { 'badge-colored': Boolean(color) },
      )
    "
    :style="badgeStyle">
    <slot />
  </div>
</template>

<style scoped>
.badge-colored {
  background-color: var(--badge-color);
  /* Fallback for browsers without relative color syntax: a darker shade of the
     background, which is readable on pale colors but muddy on mid-tones. */
  color: color-mix(in srgb, var(--badge-color), black 40%);
}

/* Black text on a light background, white on a dark one. `l` is the background's
   lightness in LCH (0-100); multiplying its distance from the midpoint by infinity
   and letting the channel clamp turns that into 0 or 100, with no color parsing
   in JavaScript and no opinion about which format the color was written in. */
@supports (color: lch(from red calc((50 - l) * infinity) 0 0)) {
  .badge-colored {
    color: lch(from var(--badge-color) calc((50 - l) * infinity) 0 0);
  }
}

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
