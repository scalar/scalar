<script lang="ts" setup>
import { useBindCx } from '@scalar/components'

import CardContent from './CardContent.vue'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()
</script>
<template>
  <CardContent v-bind="cx('scalar-card-footer')">
    <slot />
  </CardContent>
</template>
