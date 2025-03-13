<script setup lang="ts">
import { useBindCx } from '@scalar/components'

import DataTableCell from './DataTableCell.vue'

const { cx } = useBindCx()
</script>
<template>
  <DataTableCell
    is="th"
    v-bind="cx('items-center font-medium px-2 min-w-0 -outline-offset-1')">
    <slot />
  </DataTableCell>
</template>
