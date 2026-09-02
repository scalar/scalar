<script setup lang="ts">
import { ScalarIconMinus, ScalarIconPlus } from '@scalar/icons'

/**
 * The 18px glyph puck every tree control shows: an opaque knockout around a
 * 16px icon, so a rail reads as passing behind it. Hover is the
 * `tree-control-hover` variant (see tailwind.config.css): a parent carrying
 * the Tailwind group `group/tree-control`, the row heading beside a gutter
 * toggle, or the open panel's rail, so whichever element is the real pointer
 * target lights the puck the same way — a hairline ring on the page colour.
 *
 * Floating pucks hang in the row's margin (see the indentation model in
 * SchemaProperty.vue); the line anchor keeps the glyph beside a heading that wraps.
 */
const {
  open,
  floating = true,
  anchor = 'middle',
} = defineProps<{
  /** Whether the controlled panel is open; picks the minus glyph over plus when the slot is empty */
  open?: boolean
  /** Position the puck absolutely in the row's margin rather than inline */
  floating?: boolean
  /** Where a floating puck centres: the row's middle, or its first text line */
  anchor?: 'middle' | 'line'
}>()
</script>
<template>
  <span
    aria-hidden="true"
    class="schema-glyph tree-control-hover:bg-b-1 tree-control-hover:text-c-1 tree-control-hover:border-(--scalar-border-color) print:bg-transparent [&_svg]:size-4"
    :class="
      floating
        ? [
            'absolute start-[calc(-9px_-_var(--schema-gutter,16px))] -translate-y-1/2',
            anchor === 'line' ? 'top-[0.5lh]' : 'top-1/2',
          ]
        : undefined
    ">
    <!-- print: paper strips background paint but still prints the rail, so the
         knockout goes transparent. This comment stays inside the span: beside
         the root it would make the template a fragment and break fallthrough. -->
    <slot>
      <ScalarIconMinus
        v-if="open"
        weight="light" />
      <ScalarIconPlus
        v-else
        weight="light" />
    </slot>
  </span>
</template>
