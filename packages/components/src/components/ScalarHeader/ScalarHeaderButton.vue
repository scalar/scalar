<script setup lang="ts">
import type { Component } from 'vue'

import { useBindCx } from '../../hooks/useBindCx'

const { is = 'button' } = defineProps<{
  is?: string | Component
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    :type="is === 'button' ? 'button' : undefined"
    v-bind="
      cx(
        'group/button flex items-center gap-1 rounded bg-transparent px-2.5 py-2 hover:bg-b-2',
        'font-medium no-underline',
      )
    ">
    <slot />
  </component>
</template>
