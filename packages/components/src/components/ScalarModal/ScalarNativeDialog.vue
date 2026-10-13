<script lang="ts">
/**
 * A browser-managed modal for Shadow DOM embeds. Its top-layer contents stay
 * in the owning tree so host CSS and document-level portals cannot reach them.
 */
export default {}

const scrollLocks = new WeakMap<
  HTMLElement,
  { count: number; overflow: string; priority: string }
>()
</script>
<script setup lang="ts">
import { onBeforeUnmount, useTemplateRef, watch } from 'vue'

import { ScalarTeleportRoot } from '../ScalarTeleport'

const { open, unmount = true } = defineProps<{
  /** Whether the native modal is open. */
  open: boolean
  /** Keep stateful editors mounted while the dialog is closed. */
  unmount?: boolean
}>()
const emit = defineEmits<{
  /** The user requested dismissal, including through Escape. */
  close: []
}>()
defineSlots<{
  /** Modal content, including its own backdrop and accessible label. */
  default(): unknown
}>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
let lockedElement: HTMLElement | undefined

const handleClose = (): void => {
  if (open && !dialog.value?.open) {
    emit('close')
  }
}

const unlockScroll = (): void => {
  if (!lockedElement) {
    return
  }
  const lock = scrollLocks.get(lockedElement)
  if (lock && --lock.count === 0) {
    if (lock.overflow) {
      lockedElement.style.setProperty('overflow', lock.overflow, lock.priority)
    } else {
      lockedElement.style.removeProperty('overflow')
    }
    scrollLocks.delete(lockedElement)
  }
  lockedElement = undefined
}

watch(
  [() => open, dialog],
  ([isOpen, element]) => {
    if (!element) {
      return
    }
    if (isOpen) {
      if (!element.open) {
        element.showModal()
      }
      if (!lockedElement) {
        lockedElement = element.ownerDocument.documentElement
        const lock = scrollLocks.get(lockedElement) ?? {
          count: 0,
          overflow: lockedElement.style.getPropertyValue('overflow'),
          priority: lockedElement.style.getPropertyPriority('overflow'),
        }
        lock.count++
        scrollLocks.set(lockedElement, lock)
        lockedElement.style.setProperty('overflow', 'hidden')
      }
    } else {
      element.close()
      unlockScroll()
    }
  },
  { flush: 'post' },
)

onBeforeUnmount(() => {
  dialog.value?.close()
  unlockScroll()
})
</script>
<template>
  <dialog
    ref="dialog"
    class="scalar-native-dialog"
    @cancel.prevent="emit('close')"
    @close="handleClose">
    <ScalarTeleportRoot v-if="open || !unmount">
      <slot />
    </ScalarTeleportRoot>
  </dialog>
</template>
<style scoped>
.scalar-native-dialog {
  position: fixed;
  inset: 0;
  margin: 0;
  border: 0;
  padding: 0;
  width: 100dvw;
  height: 100dvh;
  max-width: none;
  max-height: none;
  overflow: visible;
  background: transparent;
  color: inherit;
}
.scalar-native-dialog::backdrop {
  background: transparent;
}
</style>
