<script setup lang="ts">
import { DropdownMenu } from 'radix-vue/namespaced'
import type { Component } from 'vue'

import { ScalarDropdownButton } from '../ScalarDropdown'

const { is = 'a' } = defineProps<{
  is?: string | Component
}>()
</script>
<template>
  <DropdownMenu.Item asChild>
    <ScalarDropdownButton :is="is">
      <slot />
    </ScalarDropdownButton>
  </DropdownMenu.Item>
</template>
