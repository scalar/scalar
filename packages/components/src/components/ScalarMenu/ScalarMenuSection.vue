<script setup lang="ts">
import { useBindCx } from '../../hooks/useBindCx'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex flex-col gap-1.5')">
    <div class="px-2.5 font-medium leading text-c-3">
      <slot name="title" />
    </div>
    <div class="flex flex-col">
      <slot />
    </div>
  </div>
</template>
