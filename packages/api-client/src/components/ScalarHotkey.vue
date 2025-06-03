<script setup lang="ts">
import { useBindCx } from '@scalar/components'
import { isMacOS } from '@scalar/helpers/general/is-mac-os'
import type { HotKeyModifiers } from '@scalar/oas-utils/entities/workspace'
import { computed } from 'vue'

const { modifier = ['Meta'], hotkey } = defineProps<{
  hotkey: string
  modifier?: HotKeyModifiers
}>()

const HotKeyLabels: Record<string, string> = {
  '⌘': 'Command',
  '^': 'Control',
  '⌥': 'Option',
  '⇧': 'Shift',
  '⇪': 'Caps Lock',
  '↵': 'Enter',
  '←': 'Left Arrow',
  '→': 'Right Arrow',
  '↑': 'Up Arrow',
  '↓': 'Down Arrow',
} as const

const ModifierKeySymbols: Record<HotKeyModifiers[number], string> = {
  Meta: isMacOS() ? '⌘' : '^',
  default: isMacOS() ? '⌘' : '^',
  Shift: '⇧',
  Alt: '⌥',
  Control: '^',
} as const

const { cx } = useBindCx()

const displayHotkey = computed(() => {
  const modifierKeys = modifier.map((mod) => ModifierKeySymbols[mod]).join('+')
  return `${modifierKeys} ${hotkey}`
})

const srLabel = computed(() => {
  const modLabels = modifier
    .map((key) => (key === 'Meta' ? (isMacOS() ? 'Command' : 'Control') : key))
    .join('+')
  const hotkeyLabel = HotKeyLabels[hotkey] ?? hotkey
  return `${modLabels} ${hotkeyLabel}`
})
</script>
<template>
  <div
    v-bind="
      cx(
        'border-(--scalar-background-3) inline-block overflow-hidden rounded border text-xxs rounded-b px-1 font-medium uppercase',
      )
    ">
    <span aria-hidden="true">{{ displayHotkey }}</span>
    <span class="sr-only">{{ srLabel }}</span>
  </div>
</template>
