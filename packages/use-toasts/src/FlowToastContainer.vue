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
  width: 100dvw;
  height: 100svh;
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1000000;

  box-sizing: border-box;

  pointer-events: none;

  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 12px;

  padding: 48px;
}
@media screen and (max-width: 600px) {
  /* Less padding for toasts on mobile */
  .toast-container {
    padding: 24px;
  }
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
