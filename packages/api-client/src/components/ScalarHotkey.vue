<script setup lang="ts">
import type { HotKeyModifiers } from '@scalar/oas-utils/entities'
import { isMacOS } from '@scalar/use-tooltip'
import { computed } from 'vue'

const props = defineProps<{
  hotkey: {
    modifier?: HotKeyModifiers
    key: string
  }
}>()

const modifier = computed(() => props.hotkey.modifier || 'meta')

const displayHotkey = computed(() => {
  const modifierKey =
    modifier.value === 'meta' ? (isMacOS() ? '⌘' : '^') : modifier.value
  return `${modifierKey} ${props.hotkey.key}`
})
</script>
<template>
  <div
    v-bind="$attrs"
    class="border-b-3 inline-block overflow-hidden rounded border-1/2 text-xxs rounded-b px-1 font-medium uppercase">
    {{ displayHotkey }}
  </div>
</template>
