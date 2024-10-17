<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'

defineProps<{
  sections: string[]
  activeSection: string
}>()

defineEmits<{
  (e: 'setActiveSection', value: string): void
}>()
</script>
<template>
  <div class="hidden lg:flex ml-auto filter-hover group lg:w-[120px]">
    <div
      class="request-section-content request-section-content-filter fade-request-section-content text-c-3 hidden xl:flex justify-end rounded text-xs gap-[1.5px] pointer-events-auto relative w-full py-2">
      <button
        v-for="section in sections"
        :key="section"
        class="hover:bg-b-2 rounded p-1 px-2 text-center font-medium w-fit"
        :class="[
          activeSection === section ? 'text-c-1  pointer-events-none' : '',
        ]"
        :isActive="activeSection === section"
        type="button"
        @click="$emit('setActiveSection', section)">
        {{ section }}
      </button>
      <div
        class="flex items-center group-hover:text-c-1 absolute -right-6 top-1/2 -translate-y-1/2">
        <span class="mr-1.5 group-hover:hidden">{{ activeSection }}</span>
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
  padding-right: 42px;
  padding-left: 24px;
  position: absolute;
  right: 0;
  transition: width 0s ease-in-out 0.2s;
  overflow: hidden;
}
.filter-hover:hover {
  width: 100%;
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
.filter-hover button {
  opacity: 0;
}
.filter-hover button:not(:last-of-type) {
  transform: translate3d(0, 3px, 0);
}
.filter-hover:hover button {
  transition:
    opacity 0.2s ease-in-out,
    transform 0.2s ease-in-out;
}
.filter-hover:hover button:nth-last-of-type(1) {
  transition-delay: 0.05s;
}
.filter-hover:hover button:nth-last-of-type(2) {
  transition-delay: 0.1s;
}
.filter-hover:hover button:nth-last-of-type(3) {
  transition-delay: 0.15s;
}
.filter-hover:hover button:nth-last-of-type(4) {
  transition-delay: 0.2s;
}
.filter-hover:hover button:nth-last-of-type(5) {
  transition-delay: 0.25s;
}
.filter-hover:hover button:nth-last-of-type(6) {
  transition-delay: 0.3s;
}
.filter-hover:hover button:nth-last-of-type(7) {
  transition-delay: 0.35s;
}
.filter-hover:hover button:nth-last-of-type(7) {
  transition-delay: 0.4s;
}
.filter-hover:hover button {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
.filter-hover:hover:before {
  opacity: 0.9;
  backdrop-filter: blur(10px);
}
</style>
