<script setup lang="ts">
import { useToasts } from './FlowToast'
import FlowToast from './FlowToast.vue'

const { toasts } = useToasts()
</script>
<template>
  <div class="toast-container">
    <TransitionGroup name="toasts">
      <FlowToast
        v-for="toast in toasts"
        :key="toast.id"
        :toast="toast" />
    </TransitionGroup>
  </div>
</template>
<style scoped>
.toast-container {
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 10000;

  pointer-events: none;

  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 12px;

  padding: 48px;
}
.toasts-move,
.toasts-enter-active,
.toasts-leave-active {
  transition: all 0.5s ease;
}
.toasts-enter-from,
.toasts-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-active {
  position: absolute;
}
</style>
