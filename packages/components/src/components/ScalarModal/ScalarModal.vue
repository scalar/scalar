<script setup lang="ts">
import { ScalarIconX } from '@scalar/icons'
import { cva, cx } from '@scalar/use-hooks/useBindCx'
import type { VariantProps } from 'cva'
import { computed, reactive, useId } from 'vue'

import { ScalarDialog } from '../ScalarDialog'
import { ScalarIconButton } from '../ScalarIconButton'

type ModalVariants = VariantProps<typeof modal>

const { size = 'md', state } = defineProps<{
  state: ReturnType<typeof useModal>
  title?: string
  bodyClass?: string
  maxWidth?: string
  size?: ModalVariants['size']
  variant?: ModalVariants['variant']
}>()

const emit = defineEmits<{
  /** Emitted when the user dismisses the modal with Escape or a backdrop click. */
  (event: 'close'): void
}>()

const titleId = useId()

/** Whether the modal is the full-height side panel rather than a centered panel */
const isFull = computed(() => size === 'full')

/** The full size dialog is an invisible full-viewport layer the side panel sits in */
const FULL_LAYOUT =
  'scalar-modal-layout-full m-0 h-dvh max-h-dvh w-dvw max-w-none overflow-visible rounded-none bg-transparent p-0 shadow-none backdrop:bg-transparent dark:backdrop:bg-transparent'

/**
 * Sync user dismissals from the dialog back into the modal state.
 *
 * Only `false` updates come through here, since the dialog never opens itself. Programmatic
 * closes via `state.hide()` do not emit `close`, which matches how the modal has always behaved.
 */
const handleOpenChange = (open: boolean): void => {
  if (!open) {
    state.hide()
    emit('close')
  }
}

const modal = cva({
  base: [
    'scalar-modal',
    'flex flex-col mb-0 rounded-lg bg-b-1 p-0 text-left leading-snug text-c-1 opacity-0 w-[calc(100vw-12px)] md:w-[calc(100vw-16px)] lg:w-[calc(100vw-32px)]',
    // Let form popovers overflow the panel rather than scrolling the whole dialog
    'overflow-visible',
  ].join(' '),
  variants: {
    size: {
      xxs: 'mt-[20svh] max-h-[60svh] max-w-[360px]',
      xs: 'mt-[20svh] max-h-[60svh] max-w-[480px]',
      sm: 'mt-[20svh] max-h-[60svh] max-w-[540px]',
      md: 'mt-[20svh] max-h-[60svh] max-w-[640px]',
      lg: 'm-auto max-h-[80svh] max-w-[800px]',
      xl: 'm-auto max-h-[90svh] max-w-[1000px]',
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
      search: 'flex flex-col !m-0 overflow-hidden p-0',
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
/**
 * Scalar Modal component
 *
 * A dialog overlay with configurable size and variant.
 * Use the {@link useModal} hook to control the open state.
 *
 * @example
 * <ScalarModal :state="modal" title="My Modal">
 *   Modal content
 * </ScalarModal>
 */
export default {}

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
  <ScalarDialog
    :aria-labelledby="title ? titleId : undefined"
    :class="isFull ? FULL_LAYOUT : modal({ size, variant })"
    :open="state.open"
    :style="isFull ? undefined : { maxWidth }"
    @update:open="handleOpenChange">
    <!-- The full size is a side panel, so the dialog fills the viewport and the panel sits inside
         it. Every other size is the panel itself, and the wrapper steps out of the layout. -->
    <div
      :class="isFull ? modal({ size, variant }) : 'contents'"
      :style="isFull ? { maxWidth } : undefined">
      <h2
        v-if="title"
        :id="titleId"
        class="scalar-modal-header text-c-1 m-0 -mb-1 rounded-lg px-3 pt-3 text-left text-sm font-medium">
        {{ title }}
      </h2>
      <div :class="isFull ? bodyClass : cx(body({ size, variant }), bodyClass)">
        <slot />
      </div>
    </div>
    <div
      v-if="isFull"
      class="close-button fixed top-2 right-2 z-10">
      <ScalarIconButton
        class="hover:bg-b-3 focus:outline-none"
        :icon="ScalarIconX"
        label="Close modal"
        @click="state.hide()" />
    </div>
  </ScalarDialog>
</template>
<style scoped>
@reference '../../style.css';

.scalar-modal::backdrop {
  animation: fadein-layout ease-in-out 0.3s forwards;
}
.scalar-modal {
  animation: fadein-modal ease-in-out 0.3s forwards;
  animation-delay: 0.1s;
  box-shadow: var(--scalar-shadow-2);
  transform: translate3d(0, 10px, 0);
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
@variant zoomed {
  .scalar-modal:not(.full-size-styles) {
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
@variant md {
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
