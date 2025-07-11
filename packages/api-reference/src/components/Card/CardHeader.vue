<script lang="ts" setup>
import { useBindCx } from '@scalar/components'
import { useId } from 'vue'

import { useCardRegionHeading } from '@/components/Card/useCardRegion'

import CardContent from './CardContent.vue'

defineOptions({ inheritAttrs: false })
const { cx } = useBindCx()

// Get a unique id for the heading
const id = useId()

// Set the heading id for the card
useCardRegionHeading(id)
</script>
<template>
  <CardContent
    v-bind="
      cx('scalar-card-header leading-[1.35] font-medium py-2.25 px-3 shrink-0')
    ">
    <div
      :id="id"
      class="scalar-card-header-title min-w-0 flex-1 truncate">
      <slot />
    </div>
    <div
      v-if="$slots.actions"
      class="flex">
      <slot name="actions" />
    </div>
  </CardContent>
</template>
