<script setup lang="ts">
import { ScalarIconCaretRight } from '@scalar/icons'
import { computed } from 'vue'

import { Anchor } from '@/components/Anchor'

import Section from './Section.vue'

const { id } = defineProps<{
  id: string
  label?: string
  /**
   * Accessible name for the collapse trigger.
   *
   * Pass the same text the heading slot renders. An accessible name that does not
   * contain the visible label breaks WCAG 2.5.3 (Label in Name), so leave this
   * undefined rather than guessing: the heading content then names the trigger.
   */
  triggerLabel?: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'copyAnchorUrl'): void
}>()

/** The trigger owns `id` as its deep link target, so the region it controls needs one of its own */
const contentId = computed<string>(() => `${id}-content`)
</script>
<template>
  <section
    :aria-label="label"
    class="collapsible-section">
    <button
      :id="id"
      :aria-controls="modelValue ? contentId : undefined"
      :aria-expanded="modelValue"
      :aria-label="triggerLabel"
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
        <slot name="heading" />
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
