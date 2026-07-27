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
    <button
      :id="id"
      :aria-controls="modelValue ? contentId : undefined"
      :aria-expanded="modelValue"
      :aria-labelledby="labelId"
      class="collapsible-section-trigger"
      :class="{ 'collapsible-section-trigger-open': modelValue }"
      type="button"
      @click="emit('update:modelValue', !modelValue)">
      <ScalarIconCaretRight
        class="size-3 transition-transform duration-100"
        :class="{ 'rotate-90': modelValue }"
        weight="bold" />
      <Anchor
        class="collapsible-section-header"
        @copyAnchorUrl="() => emit('copyAnchorUrl')">
        <!-- Wrap only the heading so `aria-labelledby` names the trigger after the
             visible text alone, excluding the caret and the nested copy-link button -->
        <span
          :id="labelId"
          class="contents">
          <slot name="heading" />
        </span>
      </Anchor>
    </button>
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
}
.collapsible-section .collapsible-section-trigger {
  display: flex;
  align-items: center;
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
