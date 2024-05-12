<script setup lang="ts">
defineProps<{
  showDescription?: boolean
}>()
</script>
<template>
  <div class="table-row">
    <div class="table-row-item">
      <slot name="key" />
    </div>
    <div class="table-row-item">
      <slot name="value" />
    </div>
    <div
      v-if="showDescription"
      class="table-row-item">
      <slot name="description" />
    </div>
    <div class="table-row-meta">
      <slot name="meta" />
    </div>
  </div>
</template>
<style scoped>
.table-row {
  border-bottom: 1px solid var(--scalar-border-color);
  display: flex;
  position: relative;
}
.table-row:last-of-type {
  border-bottom: none;
}
.table-row__active {
  border-radius: 0 0 var(--scalar-radius-lg) var(--scalar-radius-lg);
}
.table-row-item {
  width: 100%;
  border-right: 1px solid var(--scalar-border-color);
  position: relative;
}
.table-row-item :deep(input) {
  border: none;
  appearance: none;
  outline: none;
  padding: 9px;
  width: 100%;
  min-height: 100%;
  color: var(--scalar-color-1);
  font-size: var(--scalar-mini);
  background: transparent;
  font-family: var(--scalar-font);
}
.table-row-item :deep(input::placeholder) {
  font-family: var(--scalar-font);
}
.table-row-item :deep(input[disabled]) {
  background: transparent;
}
.table-row-item :deep(input:focus) {
  box-shadow: 0 0 0 1px var(--scalar-color-1);
}
.table-row-meta {
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 51px;
  user-select: none;
}
</style>
