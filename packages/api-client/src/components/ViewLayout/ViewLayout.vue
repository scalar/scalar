<script setup lang="ts">
import { useBindCx } from '@scalar/components'

const { cx } = useBindCx()
</script>

<template>
  <div
    v-bind="
      cx(
        'flex flex-col min-h-0 flex-1 *:border-t first:*:border-t-0 md:*:border-t-0 xl:overflow-hidden md:flex-row leading-3',
      )
    ">
    <slot />
  </div>
</template>
