<script setup lang="ts">
import type { ScalarIconComponent } from '@scalar/icons/types'
import { useBindCx } from '@scalar/use-hooks/useBindCx'
import { DropdownMenu } from 'radix-vue/namespaced'
import type { Component } from 'vue'

import { ScalarDropdownButton } from '../ScalarDropdown'
import { type Icon, ScalarIconLegacyAdapter } from '../ScalarIcon'

const { is = DropdownMenu.Item } = defineProps<{
  is?: string | Component
  icon?: Icon | ScalarIconComponent
  strong?: boolean
}>()

const { cx } = useBindCx()
defineOptions({ inheritAttrs: false })
</script>
<template>
  <ScalarDropdownButton
    v-bind="cx('flex items-center')"
    :is="is"
    as="a">
    <ScalarIconLegacyAdapter
      v-if="icon"
      :class="[
        strong ? 'text-c-1' : 'text-c-2',
        typeof icon === 'string' ? 'size-3' : 'size-3.5 -mx-0.25',
      ]"
      :icon="icon"
      :thickness="strong ? '2.5' : '2'"
      :weight="strong ? 'bold' : 'regular'" />
    <div
      v-else
      class="size-3" />
    <div
      class="flex items-center flex-1 min-w-0 truncate"
      :class="strong ? 'font-medium' : 'font-normal'">
      <slot />
    </div>
  </ScalarDropdownButton>
</template>
