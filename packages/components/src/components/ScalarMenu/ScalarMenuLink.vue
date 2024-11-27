<script setup lang="ts">
import type { Component } from 'vue'

import { useBindCx } from '../../hooks/useBindCx'

defineProps<{
  is?: string | Component
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is ?? 'a'"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="
      cx(
        'relative flex cursor-pointer rounded px-2.5 py-1 font-medium leading text-c-2 no-underline hover:bg-b-2 focus:text-c-1',
      )
    ">
    <slot />
  </component>
</template>
