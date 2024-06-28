<script setup lang="ts">
defineProps<{
  sections: string[]
  activeSection: string
}>()

defineEmits<{
  (e: 'setActiveSection', value: string): void
}>()
</script>
<template>
  <div
    class="request-section-content request-section-content-filter bg-b-2 text-c-3 bg-b-1 sticky top-0 z-10 mb-2.5 hidden xl:flex justify-center rounded p-[2.25px] text-xs">
    <button
      v-for="section in sections"
      :key="section"
      class="hover:text-c-1 hover:bg-b-3 w-full rounded px-1 py-1 text-center font-medium"
      :class="[
        activeSection === section
          ? 'bg-b-1 text-c-1 dark:bg-b-3 border hover:bg-b-1'
          : 'border border-transparent',
      ]"
      :isActive="activeSection === section"
      type="button"
      @click="$emit('setActiveSection', section)">
      {{ section }}
    </button>
  </div>
</template>
