<script setup lang="ts">
import { keyMap } from '@/hooks'
import { isMacOS } from '@scalar/use-tooltip'
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{
  hotkey: string
}>()

const emit = defineEmits<{ (event: 'hotkeyPressed', key: string): void }>()

// Prepend hotkey based on the OS
const modifierKey = computed(() => (isMacOS() ? '⌘' : '⌃'))

// Map the key icon displayed in UI to actual keyboard key
const resolvedHotkey = computed(() => keyMap().get(props.hotkey))

const displayHotkey = computed(() => `${modifierKey.value}${props.hotkey}`)

const keys = useMagicKeys({
  passive: false,
  onEventFired(e) {
    // Remove default behavior for keypress
    if (!isMacOS() && e.ctrlKey && e.key === resolvedHotkey.value) {
      e.preventDefault()
      e.stopPropagation()
    }
  },
})

whenever(keys[`${isMacOS() ? 'meta' : 'control'}_${props.hotkey}`], () => {
  emit('hotkeyPressed', resolvedHotkey.value || '')
})
</script>
<template>
  <div
    v-bind="$attrs"
    class="border-b-3 inline-block overflow-hidden rounded border-1/2">
    <div class="bg-b-2 text-xxs rounded-b px-1 font-medium uppercase">
      {{ displayHotkey }}
    </div>
  </div>
</template>
