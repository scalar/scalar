<script setup lang="ts">
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ScalarIconCaretRight } from '@scalar/icons'
import { useElementHover } from '@vueuse/core'
import { ref } from 'vue'

import { useSidebar } from '@/features/sidebar'
import { useNavState } from '@/hooks/useNavState'

import IntersectionObserver from '../IntersectionObserver.vue'

const { id } = defineProps<{
  id?: string
  transparent?: boolean
}>()

const button = ref()
const isHovered = useElementHover(button)

const { getSectionId, isIntersectionEnabled, replaceUrlState } = useNavState()
const { setCollapsedSidebarItem } = useSidebar()

/** On scroll over this section */
const handleScroll = () => {
  if (!id || !isIntersectionEnabled.value) {
    return
  }

  replaceUrlState(id)

  // Open models and webhooks on scroll
  if (id?.startsWith('model') || id?.startsWith('webhook')) {
    setCollapsedSidebarItem(getSectionId(id), true)
  }
}
</script>
<template>
  <IntersectionObserver
    :id="id"
    class="section-wrapper"
    @intersecting="handleScroll">
    <Disclosure
      v-slot="{ open }"
      as="section"
      class="section-accordion"
      :class="{ 'section-accordion-transparent': transparent }">
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
        <ScalarIconCaretRight
          class="section-accordion-chevron size-4.5 transition-transform"
          :class="{ 'rotate-90': open }" />
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
  color: var(--scalar-color-1);

  padding-top: 12px;
  margin-top: -12px;
}
.section-accordion {
  display: flex;
  flex-direction: column;

  border-radius: var(--scalar-radius-lg);
  background: var(--scalar-background-2);
}

.section-accordion-transparent {
  background: transparent;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
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
  color: var(--scalar-color-3);
}

.section-accordion-chevron {
  margin-right: 4px;
  cursor: pointer;
  opacity: 1;
  color: var(--scalar-color-3);
}
.section-accordion-button:hover .section-accordion-chevron {
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
