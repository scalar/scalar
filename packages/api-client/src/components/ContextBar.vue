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
    class="fade-request-section-content sticky top-0 z-10 pointer-events-none pr-1">
    <div
      class="request-section-content request-section-content-filter bg-b-1 text-c-3 bg-b-1 hidden xl:flex justify-center rounded gap-[1px] pointer-events-auto">
      <button
        v-for="section in sections"
        :key="section"
        class="hover:bg-b-2 w-full rounded px-1.5 py-1 text-center font-medium"
        :class="[
          activeSection === section
            ? 'bg-b-2 text-c-1  pointer-events-none'
            : '',
        ]"
        :isActive="activeSection === section"
        type="button"
        @click="$emit('setActiveSection', section)">
        {{ section }}
      </button>
    </div>
  </div>
</template>
<style scoped>
.fade-request-section-content {
  background: linear-gradient(
    var(--scalar-background-1) 31px,
    color-mix(in srgb, var(--scalar-background-1), transparent) 43px,
    transparent
  );
}
</style>
