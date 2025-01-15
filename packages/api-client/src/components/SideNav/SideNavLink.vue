<script setup lang="ts">
import { useLayout } from '@/hooks'
import { type Icon, ScalarIcon } from '@scalar/components'
import type { Component } from 'vue'

defineProps<{
  is?: Component | string
  active?: boolean
  icon: Icon
}>()

const { layout } = useLayout()
</script>
<template>
  <component
    :is="is ?? 'a'"
    class="hover:bg-b-2 no-underline min-w-[37px] max-w-[37px] flex items-center justify-center rounded-lg p-2"
    :class="{
      'bg-b-2 transition-none hover:cursor-auto text-c-1': active,
      'sm:min-w-max sm:max-w-max sm:rounded sm:py-1.5': layout === 'web',
    }">
    <slot name="icon">
      <ScalarIcon
        :class="layout === 'web' ? 'sm:hidden' : ''"
        :icon="icon"
        thickness="1.5" />
    </slot>
    <span
      class="text-sm font-medium sr-only"
      :class="{ 'sm:not-sr-only': layout === 'web' }">
      <slot />
    </span>
  </component>
</template>
