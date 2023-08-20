<script setup lang="ts">
import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue'
import { reactive } from 'vue'

withDefaults(
  defineProps<{
    state: ModalState
    title?: string
    bodyClass?: string
    maxWidth?: string
    variant?: 'small' | 'normal'
  }>(),
  {
    variant: 'normal',
  },
)
</script>
<script lang="ts">
export type ModalState = ReturnType<typeof useModalState>

export const useModalState = () =>
  reactive({
    open: false,
    show() {
      this.open = true
    },
    hide() {
      this.open = false
    },
  })
</script>
<template>
  <Dialog
    :open="state.open"
    @close="state.hide()">
    <div class="modal-layout">
      <DialogPanel
        class="modal"
        :class="{
          'modal-content-normal': variant === 'normal',
          'modal-content-small': variant === 'small',
        }"
        :style="{ maxWidth }">
        <DialogTitle
          v-if="title"
          class="modal-header">
          {{ title }}
        </DialogTitle>
        <DialogDescription
          class="modal-body custom-scroll"
          :class="[bodyClass]">
          <slot />
        </DialogDescription>
      </DialogPanel>
    </div>
  </Dialog>
</template>
<style scoped>
.modal-layout {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.44);
  padding: 20px;
  opacity: 0;
  animation: modal-fade 0.2s forwards;
}
.modal-body {
  padding: 12px 12px 18px 24px;
  max-height: calc(100vh - 240px);
  background: var(--theme-background-1);
  border-radius: var(--theme-radius-xl);
}
.modal {
  margin: 80px auto 0;
  position: relative;
  background: var(--theme-background-2);
  border-radius: var(--theme-radius);
  color: var(--theme-color-1);
  width: 100%;
  text-align: left;
  line-height: 1.4;
  opacity: 0;
  transform: scale(0.98);
  animation: modal-pop 0.15s 0.15s forwards;
  display: flex;
  flex-direction: column;
}
.modal-content-normal {
  max-width: 640px;
}
.modal-content-small {
  max-width: 480px;
}
@keyframes modal-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes modal-pop {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.modal-header {
  padding: 12px 24px;
  color: var(--theme-color-1);
  font-size: var(--theme-small);
  text-align: left;
  font-weight: 600;
  border-radius: var(--theme-radius)
    var(--theme-radius) 0 0;
}
</style>
