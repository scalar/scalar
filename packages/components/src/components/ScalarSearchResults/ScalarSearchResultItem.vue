<script setup lang="ts">
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import type { Component } from 'vue'

import { type Icon, ScalarIcon } from '../ScalarIcon'

defineProps<{
  icon?: Icon | Component
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
        'group flex cursor-pointer gap-2.5 rounded px-3 py-1.5 no-underline hover:bg-b-2',
        { 'bg-b-2': selected },
      )
    ">
    <!-- Icon -->
    <div
      v-if="icon"
      class="flex h-fit items-center text-sm font-medium text-c-3 group-hover:text-c-1">
      <slot name="icon">
        <template v-if="icon">
          <ScalarIcon
            v-if="typeof icon === 'string'"
            :icon="icon"
            size="sm" />
          <component
            v-else
            :is="icon"
            weight="bold"
            class="size-3.5" />
        </template>
      </slot>
      <span>&hairsp;</span>
    </div>
    <!-- Content -->
    <div class="flex min-w-0 flex-1 flex-col gap-0.75">
      <div class="flex items-center gap-1">
        <div
          class="flex-1 truncate zoomed:!whitespace-normal break-words text-sm font-medium">
          <slot />
        </div>
        <div
          v-if="$slots.addon"
          class="text-sm text-c-2">
          <slot name="addon" />
        </div>
      </div>
      <div
        v-if="$slots.description"
        class="truncate zoomed:!whitespace-normal break-words text-sm text-c-2">
        <slot name="description" />
      </div>
    </div>
  </a>
</template>
