<script setup lang="ts">
defineProps<{
  xCustomExtension: string
}>()
</script>

<template>
  <div class="x-custom-extension">
    <div class="label">x-custom-extension</div>
    <div class="value">
      {{ xCustomExtension }}
    </div>
  </div>
</template>

<style>
.x-custom-extension {
  display: flex;
  font-family: var(--scalar-font-code);
  margin-top: 1rem;
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
  background: repeating-linear-gradient(
    -45deg,
    var(--scalar-background-2) 0,
    var(--scalar-background-2) 1px,
    transparent 1px,
    transparent 5px
  );
  background-size: 100%;
  overflow: hidden;
}

.x-custom-extension .label {
  background: var(--scalar-background-2);
  border-right: var(--scalar-border-width) solid var(--scalar-border-color);
  color: var(--scalar-color-1);
  padding: 0.5rem 1rem;
  overflow: hidden;
}

.x-custom-extension .value {
  padding: 0.5rem 1rem;
}
</style>
