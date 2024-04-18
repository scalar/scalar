<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
</script>
<template>
  <div class="section-accordion-wrapper">
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
  </div>
</template>
<style scoped>
.section-accordion-wrapper {
  padding: 0 60px;
}
.section-accordion {
  position: relative;
  width: 100%;
  max-width: var(--refs-content-max-width);
  margin: auto;
}
.section-accordion-content {
  display: flex;
  flex-direction: column;
  gap: 12px;

  padding-top: 12px;
}
.section-accordion-button {
  width: 100%;
  display: flex;

  cursor: pointer;

  padding: 6px 0 6px 0;
  margin: -6px 0 -6px 0;
  border-radius: var(--scalar-radius);
}
.section-accordion-chevron {
  width: 24px;
  position: absolute;
  left: -24px;
  height: auto;
  top: 10px;
  color: var(--scalar-color-3);
}

.section-accordion-button:hover .section-accordion-chevron {
  color: var(--scalar-color-1);
}
.section-accordion-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  padding: 0 6px;
}
.section-accordion-title :deep(.section-header) {
  margin-bottom: 0;
}
@container narrow-references-container (max-width: 900px) {
  .section-accordion-chevron {
    width: 16px;
    left: -16px;
    top: 14px;
  }
  .section-accordion-wrapper {
    padding: calc(var(--refs-header-height)) 24px 0 24px;
  }
}
</style>
