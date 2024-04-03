<script setup lang="ts">
import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue'

import { type ModalState } from '../hooks'

withDefaults(
  defineProps<{
    state: ModalState
    title?: string
    bodyClass?: string
    maxWidth?: string
    variant?: 'small' | 'normal' | 'large' | 'search' | 'history'
  }>(),
  {
    variant: 'normal',
  },
)
</script>
<template>
  <Dialog
    :open="state.open"
    @close="state.hide()">
    <div class="scalar-modal-layout modal-layout">
      <DialogPanel
        class="modal"
        :class="{
          'modal-content-large': variant === 'large',
          'modal-content-normal': variant === 'normal',
          'modal-content-small': variant === 'small',
          'modal-content-search': variant === 'search',
          'modal-content-history': variant === 'history',
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
  padding: 24px 24px 18px 24px;
  max-height: calc(100vh - 240px);
  background: var(--scalar-background-1);
  border-radius: var(--scalar-radius-lg);
  font-family: var(--scalar-font);
  position: relative;
}
.modal {
  margin: 80px auto 0;
  position: relative;
  background: var(--scalar-background-2);
  border-radius: var(--scalar-radius-lg);
  color: var(--scalar-color-1);
  width: 100%;
  text-align: left;
  line-height: 1.4;
  opacity: 0;
  transform: scale(0.98);
  animation: modal-pop 0.15s 0.15s forwards;
  display: flex;
  flex-direction: column;
}
.modal:before {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 0;
  border-radius: var(--scalar-radius-lg);
}
.dark-mode .modal:before {
  background: #1a1a1a;
}
.dark-mode .modal-content-history:before {
  background: inherit;
}
.light-mode .modal:before {
  background: #fff;
}
.modal-content-history {
  background: var(--scalar-background-1);
}
.modal-content-history,
.modal-content-large {
  max-width: 800px;
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
  color: var(--scalar-color-1);
  font-size: var(--scalar-font-size-4);
  text-align: left;
  font-weight: 600;
  margin: 0;
  border-radius: var(--scalar-radius-lg) var(--scalar-radius-lg) 0 0;
  z-index: 1;
}
.modal-content-history .modal-header {
  padding-bottom: 0;
  padding-top: 24px;
}
.modal-content-history .modal-body {
  padding-top: 12px;
}
.modal-content-search {
  max-width: 540px;
}
.modal-content-search .modal-body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 440px;
}
</style>
