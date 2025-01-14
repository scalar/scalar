<script setup lang="ts">
import { ScalarIconButton } from '../ScalarIconButton'
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
    alignment: 'top',
    size: 'md',
  },
)

const modal = cva({
  base: [
    'scalar-modal',
    'col relative mx-auto mb-0 rounded-lg bg-b-1 p-0 text-left leading-snug text-c-1 opacity-0 md:w-[calc(100vw-16px)] lg:w-[calc(100vw-32px)]',
  ].join(' '),
  variants: {
    size: {
      xxs: 'mt-20 max-w-screen-xxs',
      xs: 'mt-20 max-w-screen-xs',
      sm: 'mt-20 max-w-screen-sm',
      md: 'mt-20 max-w-screen-md',
      lg: 'm-auto max-w-screen-lg',
      xl: 'm-auto max-w-screen-xl',
      full: 'full-size-styles mt-0 lg:w-full',
    },
    variant: {
      form: 'scalar-modal-form',
      history: 'scalar-modal-history bg-b-1',
      search: 'scalar-modal-search',
      error: 'scalar-modal-error',
    },
  },
})
const body = cva({
  base: [
    'scalar-modal-body',
    'relative max-h-[calc(100dvh-240px)] rounded-lg rounded-t-none border-t-1/2 bg-b-1 p-3',
  ].join(' '),
  variants: {
    variant: {
      form: 'overflow-visible',
      history: 'pt-3',
      search: 'col !m-0 max-h-[440px] overflow-hidden p-0',
      error: 'overflow-y-scroll',
    },
    size: {
      xxs: 'max-h-[calc(100dvh-240px)]',
      xs: 'max-h-[calc(100dvh-240px)]',
      sm: 'max-h-[calc(100dvh-240px)]',
      md: 'max-h-[calc(100dvh-240px)]',
      lg: 'max-h-[calc(100dvh-180px)]',
      xl: 'm-0 max-h-[calc(100dvh-120px)] p-0',
      full: 'max-h-dvh rounded-none',
    },
  },
})
</script>
<script lang="ts">
/** Hook for creating a reactive modal state */
export function useModal() {
  return reactive({
    open: false,
    show() {
      this.open = true
    },
    hide() {
      this.open = false
    },
  })
}
</script>
<template>
  <Dialog
    :open="state.open"
    @close="state.hide()">
    <div
      :class="
        cx(
          size === 'full' ? 'scalar-modal-layout-full' : 'scalar-modal-layout',
          'fixed left-0 top-0 flex items-start justify-center',
          'z-[1001] h-[100dvh] w-[100dvw]',
          'bg-backdrop opacity-0 dark:bg-backdropdark',
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
          :class="cx(body({ size, variant }), bodyClass)">
          <slot />
        </DialogDescription>
      </DialogPanel>
      <div
        v-if="size === 'full'"
        class="close-button z-10 fixed right-2 top-2">
        <ScalarIconButton
          class="hover:bg-b-3 focus:outline-none"
          icon="Close"
          label="Clear Search"
          @close="state.hide()" />
      </div>
    </div>
  </Dialog>
</template>
<style scoped>
.scalar-modal-layout {
  animation: fadein-layout ease-in-out 0.3s forwards;
}
.scalar-modal {
  animation: fadein-modal ease-in-out 0.3s forwards;
  animation-delay: 0.1s;
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  box-shadow: var(--scalar-shadow-2);
  transform: translate3d(0, 10px, 0);
}
.scalar-modal-layout-full {
  opacity: 1 !important;
  background: transparent !important;
}
.dark-mode .scalar-modal {
  background-color: color-mix(in srgb, var(--scalar-background-1), black);
}
.scalar-modal.scalar-modal-search {
  max-width: 540px;
  max-height: 440px;
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
    max-height: calc(100% - 56px);
    top: 28px;
  }
}
@keyframes fadein-layout {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes fadein-modal {
  0% {
    opacity: 0;
    transform: translate3d(0, 10px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
.full-size-styles {
  transform: translate3d(0, 0, 0);
  animation: fadein-layout ease-in-out 0.3s forwards;
  max-height: 100% !important;
  top: 0 !important;
  left: 0;
  position: absolute !important;
  margin: initial;
  border-radius: 0 !important;
  background-color: var(--scalar-background-1) !important;
  box-shadow: none !important;
  border-right: var(--scalar-border-width) solid var(--scalar-border-color);
}
@screen md {
  .full-size-styles {
    width: 50dvw !important;
  }
}
.full-size-styles:after {
  content: '';
  width: 50dvw;
  height: 100dvh;
  position: absolute;
  right: -50dvw;
  top: 0;
}
</style>
