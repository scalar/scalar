<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'

import { FlowIcon } from '../Icon'
</script>
<template>
  <Disclosure
    v-slot="{ open }"
    as="div"
    class="section-accordion"
    defaultOpen>
    <DisclosureButton class="section-accordion-button">
      <FlowIcon
        class="section-accordion-chevron"
        :icon="open ? 'ChevronDown' : 'ChevronRight'" />
      <div class="section-accordion-title">
        <slot name="title" />
      </div>
    </DisclosureButton>
    <DisclosurePanel>
      <slot />
    </DisclosurePanel>
  </Disclosure>
</template>
<style scoped>
.section-accordion {
  position: relative;
  padding: 0 60px;
  width: 100%;
}
.section-accordion-button {
  width: 100%;
  display: flex;
}
.section-accordion-chevron {
  width: 32px;
  padding: 10px 6px;
}
.section-accordion-title {
  display: flex;
  flex-direction: column;
  align-items: start;
  flex: 1;
}
</style>
