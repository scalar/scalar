<script setup lang="ts">
import {
  Dialog,
  DialogDescription,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue'
import { cva, cx } from '../../cva'

import { reactive } from 'vue'
import type { VariantProps } from 'cva'

type ModalVariants = VariantProps<typeof modal>

withDefaults(
  defineProps<{
    state: ReturnType<typeof useModal>
    title?: string
    bodyClass?: string
    maxWidth?: string
    size?: ModalVariants['size']
    variant?: ModalVariants['variant']
  }>(),
  {
    size: 'md',
  },
)

const modal = cva({
  base: [
    'scalar-modal',
    'col relative mx-auto mb-0 mt-20 w-[calc(100vw-16px)] rounded-lg bg-b-2 p-0 text-left leading-snug text-c-1 opacity-0 lg:w-[calc(100vw-32px)]',
  ].join(' '),
  variants: {
    size: {
      xxs: 'mt-20 max-w-screen-xxs',
      xs: 'mt-20 max-w-screen-xs',
      sm: 'mt-20 max-w-screen-sm',
      md: 'mt-20 max-w-screen-md',
      lg: 'mt-10 max-w-screen-lg',
      xl: 'mt-2 max-w-screen-xl',
      full: 'mt-0 overflow-hidden',
    },
    variant: {
      history: 'scalar-modal-history bg-b-1',
      search: 'scalar-modal-search',
      color: 'scalar-modal-color',
    },
  },
})
const body = cva({
  base: [
    'scalar-modal-body',
    'relative m-1 mt-0 max-h-[calc(100dvh-240px)] overflow-y-auto rounded-lg bg-b-1 p-2',
  ].join(' '),
  variants: {
    variant: {
      history: 'pt-3',
      search: 'col !m-0 max-h-[440px] overflow-hidden p-0',
      color: 'w-fit',
    },
    size: {
      xxs: 'max-h-[calc(100dvh-240px)]',
      xs: 'max-h-[calc(100dvh-240px)]',
      sm: 'max-h-[calc(100dvh-240px)]',
      md: 'max-h-[calc(100dvh-240px)]',
      lg: 'max-h-[calc(100dvh-180px)]',
      xl: 'max-h-[calc(100dvh-120px)]',
      full: 'max-h-dvh',
    },
  },
})
</script>
<script lang="ts">
export const useModal = () =>
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
    <div
      :class="
        cx(
          'scalar-modal-layout fixed left-0 top-0 flex items-start justify-center',
          'z-[1001] h-[100dvh] w-[100dvw]',
          'bg-backdrop opacity-0',
          size === 'full' && 'flex',
        )
      ">
      <DialogPanel
        :class="modal({ size, variant })"
        :style="{ maxWidth }">
        <DialogTitle
          v-if="title"
          class="scalar-modal-header m-0 -mb-1 rounded-lg p-3 text-left text-sm font-medium text-c-1"
          :class="{ 'pb-0 pt-6': variant === 'history' }">
          {{ title }}
        </DialogTitle>
        <div
          v-if="size === 'full'"
          :class="bodyClass">
          <slot />
        </div>
        <DialogDescription
          v-else
          :class="cx(bodyClass, body({ size, variant }))">
          <slot />
        </DialogDescription>
      </DialogPanel>
    </div>
  </Dialog>
</template>
<style scoped>
.scalar-modal-layout {
  animation: modal-fade 0.2s forwards;
}
.scalar-modal {
  animation: modal-pop 0.15s 0.15s forwards;
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  box-shadow: var(--scalar-shadow-2);
}
.dark-mode .scalar-modal {
  background-color: color-mix(in srgb, var(--scalar-background-1), black);
}
.scalar-modal.scalar-modal-search {
  max-width: 540px;
  max-height: 440px;
  background-color: transparent;
}
.scalar-modal.scalar-modal-color {
  width: fit-content;
}
.modal-content-search .modal-body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 440px;
}
@media (max-width: 1280px) {
  .scalar-modal {
    max-height: calc(100% - 56px);
    top: 28px;
  }
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
  }
}
</style>
