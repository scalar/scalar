<script setup lang="ts">
import SchemaGlyphPuck from './SchemaGlyphPuck.vue'

/**
 * The tree layout's disclosure control: a content-free button in the property's
 * gutter. Its accessible name is the property name via `aria-labelledby`, and the
 * child count rides `aria-describedby` so screen-reader verbosity settings apply.
 * The 24px hit box (WCAG 2.5.8) and 16px glyph puck are sized independently.
 */
const { open, panelId, panelRendered, nameId, fallbackLabel, countId } =
  defineProps<{
    /** Whether the controlled panel is expanded */
    open: boolean
    /** id of the panel this toggle controls */
    panelId: string
    /** Only reference the panel while it is actually in the DOM */
    panelRendered: boolean
    /** id of the visible property name that labels this control, absent on nameless rows */
    nameId?: string
    /**
     * Accessible name when there is no visible name to reference: pointing
     * `aria-labelledby` at an id that never renders leaves the button unnamed.
     */
    fallbackLabel: string
    /** id of the visually hidden child count that describes this control */
    countId?: string
  }>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()
</script>
<template>
  <button
    :aria-controls="panelRendered ? panelId : undefined"
    :aria-describedby="countId"
    :aria-expanded="open"
    :aria-label="nameId ? undefined : fallbackLabel"
    :aria-labelledby="nameId"
    class="property-toggle group/tree-control flex size-[var(--schema-toggle-size,24px)] shrink-0 cursor-pointer items-center justify-center rounded-[999px] border-none bg-transparent p-0 text-[color:var(--schema-glyph-color,var(--scalar-color-2))]"
    data-schema-toggle
    type="button"
    @click="emit('toggle')">
    <!-- Inline, not floating: the button is already the box the puck centres in -->
    <SchemaGlyphPuck
      class="property-glyph"
      :floating="false"
      :open="open" />
  </button>
</template>
