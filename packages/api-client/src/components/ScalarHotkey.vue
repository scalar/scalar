<script setup lang="ts">
import { isMacOS } from '@scalar/use-tooltip'
import { computed } from 'vue'

const props = defineProps<{
  hotkey: {
    modifier?: string
    key: string
  }
}>()

const displayHotkey = computed(() => {
  const modifierKey =
    props.hotkey.modifier === 'meta' ? (isMacOS() ? '⌘' : '^') : ''
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
