<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'

import IntersectionObserver from '../IntersectionObserver.vue'

defineProps<{
  id?: string
}>()
</script>
<template>
  <Disclosure
    as="section"
    class="section-accordion"
    defaultOpen>
    <DisclosureButton class="section-accordion-button">
      <slot name="title" />
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
  padding: 12px;
}

.section-accordion-content {
  border-top: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
.section-accordion-content-card {
  background: var(--theme-background-1, var(--default-theme-background-1));
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
  padding: 12px;
}
</style>
