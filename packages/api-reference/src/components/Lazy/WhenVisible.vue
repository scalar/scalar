<script setup lang="ts">
import { ref } from 'vue'

const isVisible = ref(false)
</script>
<template>
  <input
    v-model="isVisible"
    type="checkbox" />
  <slot v-if="isVisible"></slot>
  <template v-else>
    <div class="placeholder"></div>
  </template>
</template>

<style scoped>
.placeholder {
  height: 100%;
  width: 100%;
  background-color: var(--scalar-background-3);
  min-height: 50px;
}
</style>
