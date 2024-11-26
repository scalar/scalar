<script setup lang="ts">
import { tw } from '@scalar/components'

import DataTableCell from './DataTableCell.vue'
</script>
<template>
  <DataTableCell
    is="th"
    :class="tw('truncate font-medium px-2 py-1.5', $attrs.class as string)">
    <slot />
  </DataTableCell>
</template>
