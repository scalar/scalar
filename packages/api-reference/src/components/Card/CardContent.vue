<script setup lang="ts">
import { useBindCx } from '@scalar/components'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx(' scalar-card-content flex overflow-auto')">
    <slot />
  </div>
</template>
