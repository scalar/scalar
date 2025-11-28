<script setup lang="ts">
import { ScalarIcon } from '@scalar/components'
</script>

<template>
  <div
    class="splash-screen bg-b-1 fixed inset-0 z-50 flex items-center justify-center">
    <div class="flex flex-col items-center gap-4">
      <ScalarIcon
        class="logo-icon text-c-1 h-16 w-16"
        icon="Logo" />
    </div>
  </div>
</template>

<style scoped>
.splash-screen {
  opacity: 0;
  animation: fadeIn 0.5s ease-in-out forwards;
}

.logo-icon {
  opacity: 0;
  animation:
    fadeInLogo 0.6s ease-in-out 0.2s forwards,
    pulse 2s ease-in-out 0.8s infinite;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.9;
  }
}

@keyframes fadeInLogo {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 0.8;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
