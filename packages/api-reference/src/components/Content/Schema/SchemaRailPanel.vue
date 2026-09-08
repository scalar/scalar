<script setup lang="ts">
import { onBeforeUnmount, type Component } from 'vue'

/**
 * The railed panel of the schema tree: an expanded row's children behind a rail
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

/**
 * A hovered strip colours this panel's rail and lights the puck of the control
 * that owns the panel. Both used to be `:has(... :hover)` selectors, which made
 * every railed row a `:has()` invalidation anchor, so each element inserted
 * under an open row restyled its whole subtree. The strip's pointer events now
 * write the same state as attributes that exist only while it is hovered:
 * `data-rail-hovered` on the panel root and `data-child-rail-hovered` on the
 * panel's parent, the element the tailwind.config.css variants look through to
 * the control. Read off DOM adjacency exactly like the selectors they replace,
 * so every surface that rails a panel is covered without wiring.
 */
let hovered: { panel: HTMLElement; row: HTMLElement | null } | null = null

const clearRailHover = (): void => {
  hovered?.panel.removeAttribute('data-rail-hovered')
  hovered?.row?.removeAttribute('data-child-rail-hovered')
  hovered = null
}

const setRailHover = (event: Event, on: boolean): void => {
  clearRailHover()

  if (!on) {
    return
  }

  const panel = (event.currentTarget as HTMLElement).parentElement

  if (!panel) {
    return
  }

  const row = panel.parentElement
  panel.setAttribute('data-rail-hovered', '')
  row?.setAttribute('data-child-rail-hovered', '')
  hovered = { panel, row }
}

/**
 * Folding the panel hides the strip under the pointer, so no pointerleave ever
 * follows the click: the marks go before the close, or the puck stays lit.
 */
const onStripClick = (): void => {
  clearRailHover()
  emit('close')
}

/* The strip also disappears without a pointerleave when the panel unmounts,
   and the parent row it marked outlives it. */
onBeforeUnmount(clearRailHover)
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
      @click.stop="onStripClick"
      @pointerenter="setRailHover($event, true)"
      @pointerleave="setRailHover($event, false)" />
    <slot />
  </component>
</template>
