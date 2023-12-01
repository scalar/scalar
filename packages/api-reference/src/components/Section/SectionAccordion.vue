<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'

import { FlowIcon } from '../Icon'
import IntersectionObserver from '../IntersectionObserver.vue'

defineProps<{
  id?: string
}>()
</script>
<template>
  <Disclosure
    v-slot="{ open }"
    as="section"
    class="section-accordion"
    defaultOpen>
    <DisclosureButton class="section-accordion-button">
      <div class="section-accordion-button-content">
        <slot name="title" />
      </div>
      <FlowIcon
        class="section-accordion-chevron"
        :icon="open ? 'ChevronDown' : 'ChevronLeft'" />
    </DisclosureButton>
    <DisclosurePanel class="section-accordion-content">
      <IntersectionObserver
        :id="id"
        class="section-accordion-content-card">
        <slot />
      </IntersectionObserver>
    </DisclosurePanel>
  </Disclosure>
</template>
<style scoped>
.section-accordion {
  color: var(--theme-color-1);
  background: var(--theme-background-2, var(--default-theme-background-2));
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.section-accordion-button,
.section-accordion-content {
  padding: 6px;
  width: 100%;
}

.section-accordion-button {
  display: flex;
}

.section-accordion-button-content {
  flex: 1;
  min-width: 0;
}
.section-accordion-chevron {
  margin-right: 6px;
  width: 24px;
  color: var(--theme-color-3, var(--default-theme-color-3));
}

.section-accordion-content {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.section-accordion-content-card {
  background: var(--theme-background-1, var(--default-theme-background-1));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  box-shadow: var(--theme-shadow-2, var(--default-theme-shadow-2));
  padding: 24px;
}
</style>
