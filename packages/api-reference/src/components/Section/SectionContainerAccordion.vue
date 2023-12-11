<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
</script>
<template>
  <Disclosure
    v-slot="{ open }"
    as="div"
    class="section-accordion"
    defaultOpen>
    <DisclosureButton class="section-accordion-button">
      <ScalarIcon
        class="section-accordion-chevron"
        :icon="open ? 'ChevronDown' : 'ChevronRight'" />
      <div class="section-accordion-title">
        <slot name="title" />
      </div>
    </DisclosureButton>
    <DisclosurePanel class="section-accordion-content">
      <slot />
    </DisclosurePanel>
  </Disclosure>
</template>
<style scoped>
.section-accordion {
  position: relative;
  width: 100%;
  max-width: var(--refs-content-max-width);
  padding: 0 60px;
  margin: auto;
}
.section-accordion-content {
  display: flex;
  flex-direction: column;
  gap: 12px;

  padding-top: 24px;
}
.section-accordion-button {
  width: 100%;
  display: flex;

  cursor: pointer;

  padding: 6px 0 6px 0;
  margin: -6px 0 -6px 0;
  border-radius: var(--theme-radius, var(--default-theme-radius));
}
.section-accordion-button:hover {
  background: var(--theme-background-4, var(--default-theme-background-4));
}
.section-accordion-chevron {
  width: 32px;
  padding: 6px;
}
.section-accordion-title {
  display: flex;
  flex-direction: column;
  align-items: start;
  flex: 1;
}
.references-narrow .section-accordion {
  padding: calc(48px + var(--refs-header-height)) 24px 48px 24px;
}
</style>
