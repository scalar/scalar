<script setup lang="ts">
import type { Component } from 'vue'

/**
 * The railed panel of the tree layout: an expanded row's children behind a rail
 * that fades with depth. See the indentation model in SchemaProperty.vue.
 *
 * `--schema-depth` must stay inline on the element itself: the `schema-rail`
 * utility reads it for the fade. No margins of its own, because each surface
 * that joins the tree spaces its panel differently.
 */
const {
  depth,
  closeOnRail = false,
  as = 'div',
} = defineProps<{
  /** Nesting depth of the panel, driving how far the rail fades */
  depth: number
  /** Render the pointer strip over the rail that closes the panel on click */
  closeOnRail?: boolean
  /** Panel root element or component, so a headless-ui DisclosurePanel can keep the rail recipe */
  as?: string | Component
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>
<template>
  <component
    :is="as"
    class="schema-rail-panel schema-rail rail-hover:border-s-c-1 relative ps-[var(--schema-gutter,16px)]"
    :style="{ '--schema-depth': depth }">
    <!-- Pointer-only strip along the rail that folds the panel; hidden from
         assistive tech because the row's own toggle is the accessible control. -->
    <div
      v-if="closeOnRail"
      aria-hidden="true"
      class="rail-hit z-[1]"
      data-rail-hit
      @click.stop="emit('close')" />
    <slot />
  </component>
</template>
