<script setup lang="ts">
defineProps<{
  xCustomExtension: string
}>()
</script>

<template>
  <div class="x-custom-extension">
    x-custom-extension: {{ xCustomExtension }}
  </div>
</template>

<style>
.x-custom-extension {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid var(--scalar-color-1);
  border-radius: 0.5rem;
}
</style>
