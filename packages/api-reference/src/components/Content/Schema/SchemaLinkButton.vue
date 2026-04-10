<script lang="ts" setup>
defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>
<template>
  <button
    class="schema-link-button"
    type="button"
    @click.stop="$emit('click', $event)">
    <slot />
  </button>
</template>
<style scoped>
.schema-link-button {
  all: unset;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: var(--scalar-border-color);
  text-underline-offset: 2px;
  transition: color 0.15s ease;
}

.schema-link-button:hover {
  color: var(--scalar-color-1);
  text-decoration-color: currentColor;
}
</style>
