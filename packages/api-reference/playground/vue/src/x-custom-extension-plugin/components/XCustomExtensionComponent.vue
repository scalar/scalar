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
  border: 1px solid var(--scalar-border-color);
  border-radius: 0.5rem;
  background: repeating-linear-gradient(
    -45deg,
    var(--scalar-background-2) 0,
    var(--scalar-background-3) 1px,
    var(--scalar-background-1) 1px,
    var(--scalar-background-1) 4px
  );
  overflow: hidden;
}

.x-custom-extension .label {
  background: var(--scalar-background-2);
  border-right: 1px solid var(--scalar-border-color);
  color: var(--scalar-color-2);
  padding: 0.5rem 1rem;
  overflow: hidden;
}

.x-custom-extension .value {
  padding: 0.5rem 1rem;
}
</style>
