<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  duration: number
}>()

const stroke = 2

const normalizedRadius = 12 - stroke * 2
const circumference = normalizedRadius * 2 * Math.PI
const animationDuration = computed(() => `${props.duration}ms`)
</script>
<template>
  <svg viewBox="0 0 24 24">
    <circle
      class="progress-ring"
      :cx="12"
      :cy="12"
      fill="transparent"
      :r="normalizedRadius"
      stroke="currentColor"
      :stroke-dasharray="circumference + ' ' + circumference"
      :stroke-width="stroke"
      :style="{ animationDuration }" />
  </svg>
</template>

<style scoped>
.progress-ring {
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  animation: linear turn reverse forwards;
}

@keyframes turn {
  from {
    stroke-dashoffset: v-bind(circumference);
  }

  to {
    stroke-dashoffset: 0;
  }
}
</style>
