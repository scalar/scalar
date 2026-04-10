<script lang="ts" setup>
defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>
<template>
  <button
    class="property-example-label"
    type="button"
    @click="$emit('click', $event)">
    <slot />
  </button>
</template>
<style scoped>
.property-example-label:hover {
  color: var(--scalar-color-1);
}
.property-example-label {
  color: var(--scalar-color-3);
  border-bottom: var(--scalar-border-width) dotted currentColor;
}
</style>
