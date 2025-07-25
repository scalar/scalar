<script setup lang="ts">
import { ScalarIconUsers } from '@scalar/icons'
import { useBindCx } from '@scalar/use-hooks/useBindCx'

defineProps<{
  src?: string
  label?: string
}>()

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <div v-bind="cx('flex h-full items-center gap-1')">
    <img
      v-if="src"
      class="size-5 rounded"
      role="presentation"
      :src="src" />
    <div
      v-else
      aria-hidden="true"
      class="flex items-center justify-center text-3xs font-medium text-c-3 size-5 bg-b-3 rounded">
      <template v-if="label && label.length > 0">
        {{ label[0] }}
      </template>
      <ScalarIconUsers
        v-else
        class="size-3"
        weight="bold" />
    </div>
    <div
      v-if="label && label.length > 0"
      class="flex-1 truncate">
      {{ label }}
    </div>
  </div>
</template>
