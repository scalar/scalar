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
    'col relative mx-auto mb-0 mt-20 w-full rounded-lg bg-b-2 p-0 text-left leading-snug text-c-1 opacity-0',
  ].join(' '),
  variants: {
    size: {
      xs: 'max-w-screen-xs',
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      full: 'mt-0 overflow-hidden',
    },
    variant: {
      history: 'scalar-modal-history bg-b-1',
      search: 'scalar-modal-search',
    },
  },
})
const body = cva({
  base: [
    'scalar-modal-body',
    'relative max-h-[calc(100dvh-240px)] overflow-y-auto rounded-lg bg-b-1 px-6 pb-4 pt-6',
  ].join(' '),
  variants: {
    variant: {
      history: 'pt-3',
      search: 'col max-h-[440px] overflow-hidden p-0',
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
          'scalar-modal-layout fixed left-0 top-0',
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
          class="scalar-modal-header font-semiBold m-0 rounded-lg px-6 py-3 text-left text-xs text-c-1"
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
          :class="cx(bodyClass, body({ variant }))">
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
  height: calc(100% - 120px);
  width: calc(100% - 8px);
  max-width: 1390px;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  margin: auto;
}
.scalar-modal.scalar-modal-search {
  max-width: 540px;
  background-color: transparent;
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
    height: calc(100% - 56px);
    top: 46px;
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
