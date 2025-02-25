<script setup lang="ts">
import { useBindCx } from '../../hooks/useBindCx'
import { type Icon, ScalarIcon } from '../ScalarIcon'

defineProps<{
  icon?: Icon
  active?: boolean
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <li class="contents">
    <a
      v-bind="
        cx(
          'group flex cursor-pointer gap-2.5 rounded px-3 py-1.5 no-underline hover:bg-b-2',
          {
            'bg-b-2': active,
          },
        )
      ">
      <!-- Icon -->
      <div
        v-if="icon"
        class="flex h-fit items-center text-sm font-medium text-c-3 group-hover:text-c-1">
        <slot name="icon">
          <ScalarIcon
            v-if="icon"
            :icon="icon"
            size="sm" />
        </slot>
        <span>&hairsp;</span>
      </div>
      <!-- Content -->
      <div class="flex min-w-0 flex-1 flex-col gap-0.75">
        <div class="flex items-center gap-1">
          <div class="flex-1 truncate text-sm font-medium">
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
          class="truncate text-sm text-c-2">
          <slot name="description" />
        </div>
      </div>
    </a>
  </li>
</template>
