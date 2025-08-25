<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { computed } from 'vue'

import { formatHotkeySymbols, getKeyLabel } from './formatHotkey'
import type { HotKeyModifier } from './types'

const { modifier = ['Meta'], hotkey } = defineProps<{
  hotkey: string
  modifier?: HotKeyModifier[]
}>()

const { cx } = useBindCx()
defineOptions({ inheritAttrs: false })

const hotkeyChars = computed(() => formatHotkeySymbols(hotkey, modifier))
</script>
<template>
  <div
    v-bind="
      cx(
        'border-(--scalar-background-3) inline-flex gap-0.5 overflow-hidden rounded border text-xxs rounded-b p-1 font-medium uppercase leading-none',
      )
    ">
    <div
      v-for="(char, i) in hotkeyChars"
      :key="i">
      <span
        aria-hidden="true"
        class="contents">
        {{ char }}
      </span>
      <span class="sr-only">
        {{ getKeyLabel(char) }}
      </span>
    </div>
  </div>
</template>
