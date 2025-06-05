<script setup lang="ts">
import type {
  ScalarMenuButtonProps,
  ScalarMenuButtonSlots,
} from '@/components/ScalarMenu/types'
import { ScalarIconCaretDown } from '@scalar/icons'

import { ScalarHeaderButton } from '../ScalarHeader'
import { ScalarIcon } from '../ScalarIcon'

defineProps<ScalarMenuButtonProps>()

defineSlots<ScalarMenuButtonSlots>()
</script>
<template>
  <ScalarHeaderButton class="gap-0.75 px-2">
    <div class="h-5 w-auto">
      <slot name="logo">
        <ScalarIcon icon="Logo" />
      </slot>
    </div>
    <span class="sr-only">
      <slot name="label">{{ open ? 'Close Menu' : 'Open Menu' }}</slot>
    </span>
    <ScalarIconCaretDown
      class="shrink-0 text-c-3 group-hover/button:text-c-1 size-3.5"
      :class="open ? 'rotate-180' : ''"
      weight="bold" />
  </ScalarHeaderButton>
</template>
