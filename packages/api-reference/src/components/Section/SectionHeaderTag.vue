<script setup lang="ts">
const { level = 1, rule = false } = defineProps<{
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /** Draw the tree's hairline under the heading; the heading becomes a block so the rule spans full width, and margins stay with the caller. */
  rule?: boolean
}>()
</script>
<template>
  <component
    :is="`h${level}`"
    class="section-header-label"
    :class="{ 'section-header-label--rule block! border-b pb-3': rule }">
    <slot />
  </component>
</template>
<style scoped>
.section-header-label {
  display: inline;
}
</style>
