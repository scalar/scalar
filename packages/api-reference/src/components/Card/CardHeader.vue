<script lang="ts" setup>
import { useBindCx } from '@scalar/components'

import CardContent from './CardContent.vue'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <CardContent
    v-bind="
      cx('scalar-card-header leading-[1.35] font-medium py-2.25 px-3 shrink-0')
    ">
    <div class="scalar-card-header-title min-w-0 flex-1 truncate">
      <slot />
    </div>
    <div
      v-if="$slots.actions"
      class="flex">
      <slot name="actions" />
    </div>
  </CardContent>
</template>
