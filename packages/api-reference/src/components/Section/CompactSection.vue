<script setup lang="ts">
import { ScalarIconCaretRight } from '@scalar/icons'
import { computed, useId } from 'vue'

import { Anchor } from '@/components/Anchor'

import Section from './Section.vue'

const { id } = defineProps<{
  id: string
  label?: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'copyAnchorUrl'): void
}>()

/** The trigger owns `id` as its deep link target, so the region it controls needs one of its own */
const contentId = computed<string>(() => `${id}-content`)

/**
 * Name the trigger after the heading it renders by pointing `aria-labelledby` at it,
 * rather than copying the text into an `aria-label`. Referencing the visible node keeps
 * the accessible name in sync with what is on screen, so it can never drift into a
 * WCAG 2.5.3 (Label in Name) failure the way a duplicated string can.
 */
const labelId = useId()
</script>
<template>
  <section
    :aria-label="label"
    class="collapsible-section">
    <div
      class="collapsible-section-trigger"
      :class="{ 'collapsible-section-trigger-open': modelValue }">
      <Anchor
        class="collapsible-section-header"
        @copyAnchorUrl="() => emit('copyAnchorUrl')">
        <!--
          The trigger sits inside the Anchor so its copy-link button is a
          sibling: a button may not contain another button, and the parser
          hoists a nested one out. `aria-labelledby` names the trigger after
          the visible heading text alone, excluding the caret. It stays
          `inline` so the copy-link aligns to the last line of a wrapped
          heading; the padding reclaims the row's padding band as hit area and
          the negative margin cancels its layout effect, so the target grows
          (WCAG 2.5.8) without the row growing.
        -->
        <button
          :id="id"
          :aria-controls="modelValue ? contentId : undefined"
          :aria-expanded="modelValue"
          :aria-labelledby="labelId"
          class="collapsible-section-toggle -my-2.5 inline cursor-pointer py-2.5 text-start text-inherit [font:inherit]"
          type="button"
          @click="emit('update:modelValue', !modelValue)">
          <!-- Pinned to the vertical centre: inside the inline toggle the
               caret's static position would sit on the text baseline. -->
          <ScalarIconCaretRight
            class="top-1/2 size-3 -translate-y-1/2 transition-transform duration-100"
            :class="{ 'rotate-90': modelValue }"
            weight="bold" />
          <span
            :id="labelId"
            class="contents">
            <slot name="heading" />
          </span>
        </button>
      </Anchor>
    </div>
    <Section
      v-if="modelValue"
      :id="contentId"
      class="collapsible-section-content"
      :label="label">
      <slot />
    </Section>
  </section>
</template>
<style scoped>
.collapsible-section {
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  position: relative;
}
.collapsible-section-header {
  color: var(--scalar-color-1);
  /* Span the row so the toggle's overlay below can cover it. The heading text
     does not move — it is flex-start — and the copy button is positioned
     against the zero-width space after the text, not against this box. */
  flex: 1;
  min-width: 0;
}

/*
 * Restore the full-row click target the row had when the trigger itself was
 * the button.
 *
 * The toggle now sits inside the Anchor (a button may not contain the Anchor's
 * copy button) and stays `inline` so the copy-link aligns to the last line of
 * a wrapped heading — but an inline box spans only its own text, which shrank
 * the target to the heading and lost the dead-space click on every section, in
 * both layouts. The overlay stretches the hit area back across the row without
 * changing that inline flow. The copy button paints later in DOM order, so it
 * stays clickable above the overlay.
 */
.collapsible-section-toggle::after {
  content: '';
  position: absolute;
  inset: 0;
}
.collapsible-section .collapsible-section-trigger {
  display: flex;
  align-items: center;
  /* The row is no longer the button (a button may not contain the Anchor's
     copy button), but the toggle's overlay covers it, so the row is still
     clickable end to end and still shows the pointer. */
  cursor: pointer;
  padding: 10px 0;
  font-size: var(--scalar-font-size-3);
  z-index: 1;
  position: relative;
}
.collapsible-section-trigger svg {
  color: var(--scalar-color-3);
  position: absolute;
  left: -19px;
}
.collapsible-section:hover .collapsible-section-trigger svg {
  color: var(--scalar-color-1);
}
.collapsible-section .collapsible-section-trigger :deep(.anchor-copy) {
  line-height: 18.5px;
}
.collapsible-section-content {
  padding: 0;
  margin: 0;
  margin-bottom: 10px;
  scroll-margin-top: 140px;
}
</style>
