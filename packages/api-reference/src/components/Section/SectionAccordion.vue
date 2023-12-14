<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import { useElementHover } from '@vueuse/core'
import { ref } from 'vue'

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
        <ScalarIcon
          class="section-accordion-chevron"
          :icon="open ? 'ChevronDown' : 'ChevronRight'" />
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
.section-accordion::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;

  pointer-events: none;

  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}
.section-accordion::before {
  background: var(--theme-background-2, var(--default-theme-background-2));
}
.section-accordion-button {
  padding: 6px;
}

.section-accordion-button {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.section-accordion-button-content {
  flex: 1;
  min-width: 0;
}
.section-accordion-button-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--theme-color-3, var(--default-theme-color-3));
}

.section-accordion-chevron {
  margin-right: 4px;
  width: 24px;
  cursor: pointer;
  opacity: 1;
  color: var(--theme-color-3, var(--default-theme-color-3));
}
.section-accordion-button:hover .section-accordion-chevron {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.section-accordion-content {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
  display: flex;
  flex-direction: column;
}

.section-accordion-description {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-mini, var(--default-theme-mini));
  color: var(--theme-color--1, var(--default-theme-color-1));
  padding: 10px 24px;
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
