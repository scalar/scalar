<script setup lang="ts">
import { useBindCx } from '@scalar/components'
import { computed } from 'vue'

import { formatHotkeySymbols, formatScreenReaderLabel } from './formatHotkey'
import type { HotKeyModifier } from './types'

const { modifier = ['Meta'], hotkey } = defineProps<{
  hotkey: string
  modifier?: HotKeyModifier[]
}>()

const { cx } = useBindCx()

const displayHotkey = computed(() => formatHotkeySymbols(hotkey, modifier))

const srLabel = computed(() => formatScreenReaderLabel(hotkey, modifier))
</script>
<template>
  <div
    v-bind="
      cx(
        'border-(--scalar-background-3) inline-block overflow-hidden rounded border text-xxs rounded-b p-1 font-medium uppercase leading-none',
      )
    ">
    <span aria-hidden="true">{{ displayHotkey }}</span>
    <span class="sr-only">{{ srLabel }}</span>
  </div>
</template>
