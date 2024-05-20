<script setup lang="ts">
defineProps<{
  showDescription?: boolean
}>()
</script>
<template>
  <div class="table-row">
    <div class="table-row-meta">
      <slot name="meta" />
    </div>
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
  </div>
</template>
<style scoped>
.table-row {
  border-bottom: 0.5px solid var(--scalar-border-color);
  display: flex;
  position: relative;
}
.table-row:active,
.table-row:focus-within {
  background-color: color-mix(
    in srgb,
    transparent 60%,
    var(--scalar-background-2)
  );
}
.table-row:last-of-type {
  border-bottom: none;
}
.table-row__active {
  border-radius: 0 0 var(--scalar-radius-lg) var(--scalar-radius-lg);
}
.table-row-item {
  width: 100%;
  border-left: 0.5px solid var(--scalar-border-color);
  position: relative;
}
.table-row:hover .table-row-item:last-of-type {
  mask-image: linear-gradient(
    to left,
    transparent 20px,
    var(--scalar-background-2) 40px
  );
}
.table-row-item:last-of-type:focus-within :deep(input) {
  width: calc(100% - 18px);
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
.table-row-meta {
  overflow: hidden;
  flex-shrink: 0;
  transition: all 0.15s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  user-select: none;
}
</style>
