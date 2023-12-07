<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { useElementHover } from '@vueuse/core'
import { ref } from 'vue'

import { FlowIcon } from '../Icon'
import IntersectionObserver from '../IntersectionObserver.vue'

defineProps<{
  id?: string
}>()

const button = ref()
const isHovered = useElementHover(button)
</script>
<template>
  <IntersectionObserver
    :id="id"
    class="section-wrapper">
    <Disclosure
      v-slot="{ open }"
      as="section"
      class="section-accordion">
      <DisclosureButton
        ref="button"
        class="section-accordion-button">
        <div class="section-accordion-button-content">
          <slot name="title" />
        </div>
        <div
          v-if="$slots.actions"
          class="section-accordion-button-actions">
          <slot
            :active="isHovered || open"
            name="actions" />
        </div>
        <FlowIcon
          class="section-accordion-chevron"
          :icon="open ? 'ChevronDown' : 'ChevronLeft'" />
      </DisclosureButton>
      <DisclosurePanel class="section-accordion-content">
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
  </IntersectionObserver>
</template>
<style scoped>
.section-wrapper {
  color: var(--theme-color-1, var(--default-theme-color-1));

  padding-top: 12px;
  margin-top: -12px;
}
.section-accordion {
  display: flex;
  flex-direction: column;

  position: relative;
  z-index: 0;
}
/* Use a pseudo elements so we can use CSS filters to lighten the background  */
.section-accordion::before,
.section-accordion::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;

  pointer-events: none;

  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.section-accordion::before {
  background: var(--theme-background-1);
}
.section-accordion::before {
  background: currentColor;
  opacity: 0.1;
}
.section-accordion-button,
.section-accordion-content {
  padding: 6px;
}

.section-accordion-button {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-accordion-button-content {
  flex: 1;
  min-width: 0;
}
.section-accordion-button-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-accordion-chevron {
  margin-right: 4px;
  width: 24px;
  cursor: pointer;
  opacity: 0.6;
}

.section-accordion-content {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-accordion-description {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color--1, var(--default-theme-color-1));
  padding: 4px 6px;
}

.section-accordion-content-card {
  background: var(--theme-background-1, var(--default-theme-background-1));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  box-shadow: var(--theme-shadow-2, var(--default-theme-shadow-2));
  padding: 24px;
}
</style>
