<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIconCaretRight } from '@scalar/icons'
import { useElementHover } from '@vueuse/core'
import { ref, useId } from 'vue'

defineProps<{
  transparent?: boolean
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const header = ref<HTMLElement>()
const isHovered = useElementHover(header)

/** Names the toggle after the title, which renders beside the button rather than inside it. */
const titleId = useId()
</script>
<template>
  <Disclosure
    as="section"
    class="section-accordion"
    :class="{ 'section-accordion-transparent': transparent }">
    <!--
      `group/heading` reveals the title's copy-link button (see `Anchor`) while the row is
      hovered: the title lets pointer events through to the toggle below it, so it never
      matches `:hover` on its own.
    -->
    <div
      ref="header"
      class="section-accordion-header group/heading">
      <DisclosureButton
        :aria-labelledby="titleId"
        class="section-accordion-button absolute inset-0 cursor-pointer border-none bg-transparent p-0"
        @click="() => emit('update:modelValue', !modelValue)" />
      <div
        :id="titleId"
        class="section-accordion-button-content pointer-events-none relative">
        <slot name="title" />
      </div>
      <div
        v-if="$slots.actions"
        class="section-accordion-button-actions pointer-events-none relative">
        <slot
          :active="isHovered || modelValue"
          name="actions" />
      </div>
      <ScalarIconCaretRight
        class="section-accordion-chevron pointer-events-none size-4.5 transition-transform"
        :class="{ 'rotate-90': modelValue }" />
    </div>
    <DisclosurePanel
      v-if="modelValue"
      class="section-accordion-content"
      static>
      <div
        v-if="$slots.description"
        class="section-accordion-description">
        <slot name="description" />
      </div>
      <div class="section-accordion-content-card">
        <slot />
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
<style scoped>
.section-wrapper {
  color: var(--scalar-color-1);

  padding-top: 12px;
  margin-top: -12px;
}
.section-accordion {
  display: flex;
  flex-direction: column;

  border-radius: var(--scalar-radius-lg);
  background: var(--scalar-background-2);

  /* Offset by header height to line up scroll position */
  scroll-margin-top: var(--refs-viewport-offset);
}

.section-accordion-transparent {
  background: transparent;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
}

.section-accordion-header {
  position: relative;

  display: flex;
  align-items: center;
  gap: 6px;

  padding: 6px;
  cursor: pointer;
}

/* The controls the header carries — the copy link in the title, the actions — keep their clicks. */
.section-accordion-button-content
  :is(a[href], button, input, select, textarea, [role='button'], [tabindex]),
.section-accordion-button-actions
  :is(a[href], button, input, select, textarea, [role='button'], [tabindex]) {
  pointer-events: auto;
}

.section-accordion-button-content {
  flex: 1;
  min-width: 0;
}
.section-accordion-button-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--scalar-color-3);
}

.section-accordion-chevron {
  margin-right: 4px;
  cursor: pointer;
  opacity: 1;
  color: var(--scalar-color-3);
}
.section-accordion-header:hover .section-accordion-chevron {
  color: var(--scalar-color-1);
}
.section-accordion-content {
  border-top: var(--scalar-border-width) solid var(--scalar-border-color);
  display: flex;
  flex-direction: column;
}

.section-accordion-description {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-mini);
  color: var(--scalar-color--1);
  padding: 10px 12px 0px 12px;
}
.section-accordion-content-card :deep(.property:last-of-type) {
  padding-bottom: 9px;
}
</style>
