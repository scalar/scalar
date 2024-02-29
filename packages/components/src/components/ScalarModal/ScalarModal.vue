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
    'col leading-snug relative mx-auto mb-0 mt-20 w-full rounded-lg bg-back-2 text-left text-fore-1 opacity-0',
  ].join(' '),
  variants: {
    size: {
      xs: 'max-w-screen-xs',
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
    },
    variant: {
      history: 'scalar-modal-history bg-back-1',
      search: 'scalar-modal-search',
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
          'bg-backdrop p-5 opacity-0',
        )
      ">
      <DialogPanel
        :class="modal({ size, variant })"
        :style="{ maxWidth }">
        <DialogTitle
          v-if="title"
          class="scalar-modal-header font-semiBold m-0 rounded-lg px-6 py-3 text-left text-xs text-fore-1"
          :class="{ 'pb-0 pt-6': variant === 'history' }">
          {{ title }}
        </DialogTitle>
        <DialogDescription
          class="scalar-modal-body relative max-h-[calc(100dvh-240px)] overflow-y-auto rounded-lg bg-back-1 px-6 pb-4 pt-6"
          :class="
            cx(
              bodyClass,
              variant === 'history' && 'pt-3',
              variant === 'search' && 'col max-h-[440px] overflow-hidden p-0',
            )
          ">
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
  transform: scale(0.98);
  animation: modal-pop 0.15s 0.15s forwards;
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
</style>
