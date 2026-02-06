<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'

import { handleHotKeyDown, type HotKeyEvent } from '@/libs'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import ModalClientContainer from '@/v2/components/modals/ModalClientContainer.vue'

const { activeWorkspace } = useActiveEntities()
const { modalState, events } = useWorkspace()

/** Handles the hotkey events as well as custom config */
const handleKeyDown = (ev: KeyboardEvent) =>
  handleHotKeyDown(ev, events.hotKeys, activeWorkspace.value?.hotKeyConfig)

watch(
  () => modalState.open,
  (open) => {
    if (open) {
      // Add the global hotkey listener
      window.addEventListener('keydown', handleKeyDown)
      // Disable scrolling
      document.documentElement.style.overflow = 'hidden'
    } else {
      // Remove the global hotkey listener
      window.removeEventListener('keydown', handleKeyDown)
      // Restore scrolling
      document.documentElement.style.removeProperty('overflow')
    }
  },
)

// Close on escape
const onCloseModal = (event?: HotKeyEvent) =>
  event?.closeModal && modalState.open && modalState.hide()
onMounted(() => events.hotKeys.on(onCloseModal))

onBeforeUnmount(() => {
  // Make sure scrolling is back!
  document.documentElement.style.removeProperty('overflow')
  events.hotKeys.off(onCloseModal)
})
</script>

<template>
  <ModalClientContainer :modalState>
    <RouterView key="$route.fullPath" />
  </ModalClientContainer>
</template>
