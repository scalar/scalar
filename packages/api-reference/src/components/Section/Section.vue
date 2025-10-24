<script setup lang="ts">
import IntersectionObserver from '@/components/IntersectionObserver.vue'

defineProps<{
  id?: string
}>()

const emit = defineEmits<{
  (e: 'intersecting', id: string): void
}>()
</script>
<template>
  <IntersectionObserver
    is="section"
    :id="id"
    class="section"
    @intersecting="(id) => emit('intersecting', id)">
    <slot />
  </IntersectionObserver>
</template>

<style scoped>
.section {
  position: relative;
  display: flex;
  flex-direction: column;

  max-width: var(--refs-content-max-width);
  margin: auto;

  padding: 90px 0;

  /* Offset by header height to line up scroll position */
  scroll-margin-top: var(--refs-viewport-offset);
}
.section:has(~ div.contents) {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
.references-classic .section {
  padding: 48px 0;
  gap: 24px;
}
@container narrow-references-container (max-width: 900px) {
  .references-classic .section,
  .section {
    padding: 48px 24px;
  }
}
.section:not(:last-of-type) {
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
}
</style>
