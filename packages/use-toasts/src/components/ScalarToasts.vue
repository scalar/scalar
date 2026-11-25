<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { toast, Toaster } from 'vue-sonner'

import { useToasts, type ToastOptions } from '../hooks/useToasts'

// The toaster is only required on the client
const isClientMounted = ref(false)

/** Marks where the toaster is mounted, so we can tell whether that spot is visible */
const anchor = ref<HTMLElement | null>(null)

/** The popover the toaster renders in, so toasts can sit in the browser's top layer */
const layer = ref<HTMLElement | null>(null)

/** The open modal dialog the toaster is currently moved into, if any */
const host = ref<HTMLDialogElement | null>(null)

/** Whether a dialog was opened with `showModal()`, which is what puts it in the top layer */
const isModal = (dialog: HTMLDialogElement): boolean => {
  try {
    return dialog.matches(':modal')
  } catch {
    // Older browsers do not know `:modal` and throw on it
    return false
  }
}

/**
 * Find the open modal dialog the user is looking at
 *
 * A modal dialog makes everything outside it inert: toasts there are hidden from screen readers
 * and cannot be hovered, and a click on one lands on the dialog's backdrop. So while a modal is
 * open the toaster moves into it. Nested modals come later in document order, so the last one is
 * the topmost.
 */
const findModalHost = (): HTMLDialogElement | null => {
  const root = anchor.value?.getRootNode()
  const scope =
    root instanceof Document || root instanceof ShadowRoot ? root : document
  const dialogs = Array.from(scope.querySelectorAll('dialog')).filter(isModal)
  return dialogs[dialogs.length - 1] ?? null
}

/**
 * Whether toasts from this toaster would be seen
 *
 * A toaster can be mounted somewhere hidden, such as the API client's modal while it is closed. It
 * is still useful while a modal is open, since it moves into that modal; otherwise it is only
 * useful when its own spot on the page is visible.
 */
const isAvailable = (): boolean => {
  if (findModalHost()) {
    return true
  }
  const element = anchor.value
  if (!element) {
    return false
  }
  return typeof element.checkVisibility === 'function'
    ? element.checkVisibility({ visibilityProperty: true })
    : true
}

/**
 * Move the toasts to the top of the top layer.
 *
 * A modal opened with `showModal()` paints above everything outside the top layer, whatever its
 * `z-index`. A manual popover lives in the top layer too, and showing it again puts it above
 * anything that entered the top layer since. Moving the popover in the document also hides it,
 * so this runs after every move as well. Browsers without the Popover API keep the toaster in the
 * normal flow, as before.
 */
const raise = (): void => {
  const element = layer.value
  if (!element || typeof element.showPopover !== 'function') {
    return
  }
  if (element.matches(':popover-open')) {
    element.hidePopover()
  }
  element.showPopover()
}

/** Bring the toaster back to its own spot once the modal it moved into closes */
const handleHostClose = async (): Promise<void> => {
  host.value = null
  await nextTick()
  raise()
}

/** Move the toaster into the topmost open modal, or back home when there is none */
const followModalHost = async (): Promise<void> => {
  const next = findModalHost()
  if (next !== host.value) {
    host.value?.removeEventListener('close', handleHostClose)
    next?.addEventListener('close', handleHostClose, { once: true })
    host.value = next
  }
  await nextTick()
  raise()
}

const toastMethods = {
  success: toast.success,
  error: toast.error,
  warn: toast.warning,
  info: toast,
}

const { initializeToasts } = useToasts()

/** Unregisters this toaster, set once it registers on the client */
let unregister: (() => void) | undefined

onMounted(async () => {
  // Registering on the client only keeps server renders from piling up toasters that never unmount
  unregister = initializeToasts(
    (message, level = 'info', options: ToastOptions = {}) => {
      const toastAction = toastMethods[level] || toastMethods.info

      // The toast waits for the toaster to finish moving, so it appears where the user is looking
      void followModalHost().then(() =>
        toastAction(message, {
          duration: options.timeout || 3000,
          description: options.description,
        }),
      )
    },
    { isAvailable },
  )

  isClientMounted.value = true
  await nextTick()
  raise()
})

onBeforeUnmount(() => {
  unregister?.()
  host.value?.removeEventListener('close', handleHostClose)
})
</script>

<template>
  <span
    ref="anchor"
    aria-hidden="true"
    class="scalar-toaster-anchor" />
  <Teleport
    :disabled="!host"
    :to="host ?? 'body'">
    <div
      ref="layer"
      class="scalar-toaster-layer"
      popover="manual">
      <Toaster
        v-if="isClientMounted"
        class="scalar-toaster">
      </Toaster>
    </div>
  </Teleport>
</template>

<style>
@import 'vue-sonner/style.css';

/*
 * Strip the popover's default box, so only the toaster (which positions itself against the
 * viewport) shows. The layer is empty space, so it takes no room and no clicks of its own.
 */
.scalar-toaster-layer {
  inset: 0 auto auto 0;
  width: 0;
  height: 0;
  margin: 0;
  padding: 0;
  border: 0;
  overflow: visible;
  background: transparent;
  color: inherit;
}

/**
* We need to be explicit to avoid !important. :)
*
* Original: https://github.com/xiaoluoboding/vue-sonner/blob/311ecc8d9a51b619f968e20f4b44992ad8412850/packages/styles.css#L91-L103
*/
.scalar-toaster [data-sonner-toast][data-styled='true'] {
  background: var(--scalar-background-1);
  color: var(--scalar-color-1);
  padding: 18px;
  border: none;
  border-radius: var(--scalar-radius-lg);
  font-size: var(--scalar-font-size-3);
  font-weight: var(--scalar-font-medium);
  box-shadow: var(--scalar-shadow-2);
}
.scalar-toaster [data-sonner-toast] [data-icon] {
  align-self: flex-start;
  position: relative;
  top: 2px;
}
.scalar-toaster [data-sonner-toast][data-styled='true'][data-expanded='true'] {
  height: auto;
}
.scalar-toaster [data-sonner-toast][data-type='error'] {
  background: var(--scalar-background-1);
}
.scalar-toaster [data-sonner-toast][data-type='error'] [data-icon] {
  color: color-mix(in srgb, var(--scalar-color-red) 75%, var(--scalar-color-1));
}
.scalar-toaster [data-sonner-toast][data-type='warning'] {
  background: var(--scalar-background-1);
}
.scalar-toaster [data-sonner-toast][data-type='warning'] [data-icon] {
  color: color-mix(
    in srgb,
    var(--scalar-color-orange) 90%,
    var(--scalar-color-1)
  );
}
</style>
