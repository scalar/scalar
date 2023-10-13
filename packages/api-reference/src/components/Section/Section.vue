<script setup lang="ts">
import IntersectionObserver from '../IntersectionObserver.vue'

defineProps<{
  id?: string
}>()
</script>

<template>
  <IntersectionObserver
    is="section"
    :id="id"
    class="section">
    <slot />
  </IntersectionObserver>
</template>

<style scoped>
.section {
  position: relative;
  display: flex;
  flex-direction: column;

  max-width: 1120px;
  margin: auto;
  padding: 90px 0;
}
.section:not(:last-of-type) {
  border-bottom: 1px solid
    var(--theme-border-color, var(--default-theme-border-color));
}
</style>
