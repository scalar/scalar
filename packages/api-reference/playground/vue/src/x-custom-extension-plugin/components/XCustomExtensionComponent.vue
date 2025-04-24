<script setup lang="ts">
import '../assets/style.css'

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
