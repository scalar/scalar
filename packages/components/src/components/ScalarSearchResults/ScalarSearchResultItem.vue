<script setup lang="ts">
import type { ScalarIconComponent } from '@scalar/icons/types'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

import { type Icon, ScalarIconLegacyAdapter } from '../ScalarIcon'

defineProps<{
  icon?: Icon | ScalarIconComponent
  selected?: boolean
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <a
    :aria-selected="selected"
    role="option"
    tabindex="-1"
    v-bind="
      cx(
        'group flex cursor-pointer gap-2 rounded px-2 py-1.5 no-underline hover:bg-b-2 text-base/5',
        { 'bg-b-2': selected },
      )
    ">
    <!-- Icon -->
    <div
      v-if="icon"
      class="text-c-3 group-hover:text-c-1 flex h-fit items-center text-sm font-medium">
      <slot name="icon">
        <ScalarIconLegacyAdapter
          v-if="icon"
          class="size-4"
          :icon="icon" />
      </slot>
      <span>&hairsp;</span>
    </div>
    <!-- Content -->
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <div class="flex items-center gap-1">
        <div
          class="zoomed:whitespace-normal! flex-1 truncate font-medium wrap-break-word">
          <slot />
        </div>
        <div
          v-if="$slots.addon"
          class="text-c-2 text-base">
          <slot name="addon" />
        </div>
      </div>
      <div
        v-if="$slots.description"
        class="zoomed:whitespace-normal! text-c-2 truncate wrap-break-word">
        <slot name="description" />
      </div>
    </div>
  </a>
</template>
