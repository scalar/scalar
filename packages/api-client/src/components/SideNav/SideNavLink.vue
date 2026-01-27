<script setup lang="ts">
import type { Component } from 'vue'

import { useLayout } from '@/hooks'

defineProps<{
  is?: Component | string
  active?: boolean
  icon?: Component
}>()

const { layout } = useLayout()
</script>
<template>
  <component
    :is="is ?? 'a'"
    class="hover:bg-b-3 hover:dark:bg-b-2 flex max-w-[37px] min-w-[37px] items-center justify-center rounded-lg p-2 no-underline"
    :class="{
      'bg-b-3 dark:bg-b-2 text-c-1 transition-none hover:cursor-default':
        active,
      'sm:max-w-max sm:min-w-max sm:rounded sm:py-1.5': layout === 'web',
    }">
    <slot name="icon">
      <component
        :is="icon"
        :class="layout === 'web' ? 'sm:hidden' : ''"
        thickness="1.5" />
    </slot>
    <span
      class="sr-only text-sm font-medium"
      :class="{ 'sm:not-sr-only': layout === 'web' }">
      <slot />
    </span>
  </component>
</template>
