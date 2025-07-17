<script setup lang="ts" generic="T extends string">
import { ScalarIcon } from '@scalar/components'
import { nextTick, ref } from 'vue'

import SectionFilterButton from '@/components/SectionFilterButton.vue'

const { filters = [], filterIds } = defineProps<{
  filters?: T[]
  filterIds?: Record<T, string>
}>()

const model = defineModel<T>()

const tablist = ref<HTMLDivElement>()

/** Keyboard navigation */
const navigateSection = (direction: 'next' | 'prev') => {
  const offset = direction === 'prev' ? -1 : 1
  const index = model.value ? filters.indexOf(model.value) : 0
  const length = filters.length

  // Ensures we loop around the array by using the remainder
  const newIndex = (index + offset + length) % length
  model.value = filters[newIndex]

  // Focus the selected button
  nextTick(() => {
    if (tablist.value) {
      const selectedButton = tablist.value.querySelector(
        `button[aria-selected="true"]`,
      ) satisfies HTMLButtonElement | null
      if (selectedButton) {
        selectedButton.focus()
      }
    }
  })
}
</script>
<template>
  <div
    ref="tablist"
    class="filter-hover context-bar-group ml-auto hidden lg:flex"
    role="tablist"
    @keydown.left="navigateSection('prev')"
    @keydown.right="navigateSection('next')">
    <div
      class="request-section-content request-section-content-filter fade-request-section-content text-c-3 pointer-events-auto relative hidden w-full justify-end gap-[1.5px] rounded py-1.75 text-xs xl:flex">
      <SectionFilterButton
        v-for="filter in filters"
        :key="filter"
        class="filter-hover-item"
        :controls="filterIds?.[filter]"
        role="tab"
        :selected="model === filter"
        @click="model = filter">
        {{ filter }}
      </SectionFilterButton>
      <div
        class="filter-button context-bar-group-hover:text-c-1 absolute -right-[30px] flex items-center">
        <span class="context-bar-group-hover:hidden mr-1.5">{{ model }}</span>
        <ScalarIcon
          icon="FilterList"
          size="md"
          thickness="2" />
      </div>
    </div>
  </div>
</template>
<style scoped>
.fade-request-section-content {
  background: linear-gradient(
    to left,
    var(--scalar-background-1) 64%,
    transparent
  );
}
.filter-hover {
  height: 100%;
  padding-right: 39px;
  padding-left: 24px;
  position: absolute;
  right: 0;
  transition: width 0s ease-in-out 0.2s;
  overflow: hidden;
}
.filter-hover:hover,
.filter-hover:has(:focus-visible) {
  width: 100%;
  z-index: 10;
}
.filter-hover:before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: fit-content;
  background-color: var(--scalar-background-1);
  opacity: 0;
  transition: all 0.3s ease-in-out;
  pointer-events: none;
}
.filter-hover-item {
  opacity: 0;
}
.filter-hover-item:not(:last-of-type) {
  transform: translate3d(0, 3px, 0);
}
.filter-hover:hover .filter-hover-item {
  transition:
    opacity 0.2s ease-in-out,
    transform 0.2s ease-in-out;
}
.filter-hover:hover .filter-hover-item:nth-last-of-type(1) {
  transition-delay: 0.05s;
}
.filter-hover:hover .filter-hover-item:nth-last-of-type(2) {
  transition-delay: 0.1s;
}
.filter-hover:hover .filter-hover-item:nth-last-of-type(3) {
  transition-delay: 0.15s;
}
.filter-hover:hover .filter-hover-item:nth-last-of-type(4) {
  transition-delay: 0.2s;
}
.filter-hover:hover .filter-hover-item:nth-last-of-type(5) {
  transition-delay: 0.25s;
}
.filter-hover:hover .filter-hover-item:nth-last-of-type(6) {
  transition-delay: 0.3s;
}
.filter-hover:hover .filter-hover-item:nth-last-of-type(7) {
  transition-delay: 0.35s;
}
.filter-hover:hover .filter-hover-item,
.filter-hover:has(:focus-visible) .filter-hover-item {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
.filter-hover:hover:before,
.filter-hover:has(:focus-visible):before {
  opacity: 0.9;
  backdrop-filter: blur(10px);
}
.filter-button {
  top: 50%;
  transform: translateY(-50%);
}
.context-bar-group:hover .context-bar-group-hover\:text-c-1,
.context-bar-group:has(:focus-visible) .context-bar-group-hover\:text-c-1 {
  --tw-text-opacity: 1;
  color: rgb(var(--scalar-color-1) / var(--tw-text-opacity));
}

.context-bar-group:hover .context-bar-group-hover\:hidden,
.context-bar-group:has(:focus-visible) .context-bar-group-hover\:hidden {
  display: none;
}
</style>
