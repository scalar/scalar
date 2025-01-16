<script setup lang="ts">
import { defineProps } from 'vue'

const { color } = defineProps<{
  color?: string
}>()
</script>

<template>
  <div
    class="badge"
    :class="color">
    <slot />
  </div>
</template>

<style scoped>
.badge {
  color: var(--scalar-color-2);
  font-size: var(--scalar-micro);
  background: var(--scalar-background-2);
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: var(--scalar-semibold);
  display: inline-block;
  text-transform: uppercase;
}

.green {
  color: var(--scalar-color-green);
}

.orange {
  color: var(--scalar-color-orange);
}

.red {
  color: var(--scalar-color-red);
}
</style>
