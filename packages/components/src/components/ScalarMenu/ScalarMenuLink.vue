<script setup lang="ts">
import { DropdownMenu } from 'radix-vue/namespaced'
import type { Component } from 'vue'

import { ScalarDropdownButton } from '../ScalarDropdown'
import { type Icon, ScalarIcon } from '../ScalarIcon'

const { is = DropdownMenu.Item } = defineProps<{
  is?: string | Component
  icon?: Icon | Component
  strong?: boolean
}>()
</script>
<template>
  <ScalarDropdownButton
    :is="is"
    as="a">
    <template v-if="icon">
      <ScalarIcon
        v-if="typeof icon === 'string'"
        :class="strong ? 'text-c-1' : 'text-c-2'"
        :icon="icon"
        size="xs"
        :thickness="strong ? '2.5' : '2'" />
      <component
        v-else
        :is="icon"
        :class="strong ? 'text-c-1' : 'text-c-2'"
        :weight="strong ? 'bold' : 'regular'"
        class="size-3.5 -mx-0.25" />
    </template>
    <div
      v-else
      class="size-3" />
    <div
      class="flex items-center flex-1"
      :class="strong ? 'font-medium' : 'font-normal'">
      <slot />
    </div>
  </ScalarDropdownButton>
</template>
