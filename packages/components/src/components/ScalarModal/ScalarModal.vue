<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { cva, cx } from '@scalar/use-hooks/useBindCx'
import type { VariantProps } from 'cva'
import { reactive } from 'vue'

import { ScalarIconButton } from '../ScalarIconButton'

type ModalVariants = VariantProps<typeof modal>

const { size = 'md' } = defineProps<{
  state: ReturnType<typeof useModal>
  title?: string
  bodyClass?: string
  maxWidth?: string
  size?: ModalVariants['size']
  variant?: ModalVariants['variant']
}>()

const modal = cva({
  base: [
    'scalar-modal',
    'flex flex-col relative mb-0 rounded-lg bg-b-1 p-0 text-left leading-snug text-c-1 opacity-0 w-[calc(100vw-12px)] md:w-[calc(100vw-16px)] lg:w-[calc(100vw-32px)]',
  ].join(' '),
  variants: {
    size: {
      xxs: 'mt-[20svh] max-h-[60svh] max-w-screen-xxs',
      xs: 'mt-[20svh] max-h-[60svh] max-w-screen-xs',
      sm: 'mt-[20svh] max-h-[60svh] max-w-screen-sm',
      md: 'mt-[20svh] max-h-[60svh] max-w-screen-md',
      lg: 'm-auto max-h-[80svh] max-w-screen-lg',
      xl: 'm-auto max-h-[90svh] max-w-screen-xl',
      full: 'full-size-styles max-h-dvh mt-0 lg:w-full',
    },
    variant: {
      form: 'scalar-modal-form',
      search: 'scalar-modal-search mt-[15svh] max-h-[60svh] max-w-[540px]',
      error: 'scalar-modal-error',
    },
  },
})
const body = cva({
  base: ['scalar-modal-body', 'relative flex-1 min-h-0 p-3'].join(' '),
  variants: {
    variant: {
      form: 'overflow-visible',
      search: 'col !m-0 overflow-hidden p-0',
      error: 'overflow-y-scroll',
    },
    size: {
      xxs: '',
      xs: '',
      sm: '',
      md: '',
      lg: '',
      xl: 'm-0 p-0',
      full: ' rounded-none',
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
          class="scalar-modal-header m-0 -mb-1 rounded-lg pt-3 px-3 text-left text-sm font-medium text-c-1">
          {{ title }}
        </DialogTitle>
        <div
          v-if="size === 'full'"
          :class="bodyClass">
          <slot />
        </div>
        <div
          v-else
          :class="cx(body({ size, variant }), bodyClass)">
          <slot />
        </div>
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
  box-shadow: var(--scalar-shadow-2);
  transform: translate3d(0, 10px, 0);
}
.scalar-modal-layout-full {
  opacity: 1 !important;
  background: transparent !important;
}
.modal-content-search .modal-body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 440px;
}
/*
 * Allow the modal to fill more space on
 * very short (or very zoomed in) screens
 */
@screen zoomed {
  .scalar-modal-layout .scalar-modal {
    margin-top: 5svh;
    max-height: 90svh;
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
