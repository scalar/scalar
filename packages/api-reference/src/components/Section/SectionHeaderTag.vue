<script setup lang="ts">
const { level = 1 } = defineProps<{ level?: 1 | 2 | 3 | 4 | 5 | 6 }>()
</script>
<template>
  <component
    :is="`h${level}`"
    class="section-header-label">
    <slot />
  </component>
</template>
<style scoped>
.section-header-label {
  display: inline;
}
</style>
