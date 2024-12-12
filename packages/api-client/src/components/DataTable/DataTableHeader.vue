<script setup lang="ts">
import { useBindCx } from '@scalar/components'

import DataTableCell from './DataTableCell.vue'

const { cx } = useBindCx()
</script>
<template>
  <DataTableCell
    is="th"
    v-bind="cx('truncate font-medium px-2 py-1.5')">
    <slot />
  </DataTableCell>
</template>
