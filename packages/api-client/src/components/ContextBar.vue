<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
import { computed, useId } from 'vue'

const props = defineProps<{
  sections: string[]
  activeSection: string
}>()

const emit = defineEmits<{
  (e: 'setActiveSection', value: string): void
}>()

const name = useId()

const model = computed<string>({
  get: () => props.activeSection,
  set: (value) => emit('setActiveSection', value),
})
</script>
<template>
  <fieldset
    class="filter-hover context-bar-group ml-auto hidden lg:flex lg:w-[120px]">
    <legend class="sr-only">Filter Sections</legend>
    <div
      class="request-section-content request-section-content-filter fade-request-section-content text-c-3 pointer-events-auto relative hidden w-full justify-end gap-[1.5px] rounded py-2 text-xs xl:flex">
      <label
        v-for="section in sections"
        :key="section"
        class="filter-hover-item hover:bg-b-2 flex w-fit cursor-pointer items-center whitespace-nowrap rounded p-1 px-2 text-center font-medium has-[:focus-visible]:outline"
        :class="[model === section ? 'text-c-1 pointer-events-none' : '']">
        {{ section }}
        <input
          v-model="model"
          class="sr-only"
          :name="name"
          type="radio"
          :value="section" />
      </label>
      <div
        class="context-bar-group-hover:text-c-1 absolute -right-[30px] top-1/2 flex -translate-y-1/2 items-center">
        <span class="context-bar-group-hover:hidden mr-1.5">{{ model }}</span>
        <ScalarIcon
          icon="FilterList"
          size="md"
          thickness="2" />
      </div>
    </div>
  </fieldset>
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
  padding-right: 42px;
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
  height: 100%;
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
