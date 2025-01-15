<script setup lang="ts">
import { useBindCx } from '@scalar/components'
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    is?: string | Component
  }>(),
  { is: 'td' },
)

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <component
    :is="is"
    v-bind="
      cx(
        'max-h-8 min-h-8 min-w-8 border-l-0 border-t border-b-0 border-r flex text-sm last:border-r-0 group-last:border-b-transparent p-0 m-0 relative',
      )
    "
    role="cell">
    <slot />
  </component>
</template>
