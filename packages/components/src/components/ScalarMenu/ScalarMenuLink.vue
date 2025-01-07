<script setup lang="ts">
import { DropdownMenu } from 'radix-vue/namespaced'
import type { Component } from 'vue'

import { ScalarDropdownButton } from '../ScalarDropdown'

const { is = DropdownMenu.Item } = defineProps<{
  is?: string | Component
}>()
</script>
<template>
  <ScalarDropdownButton :is="is">
    <slot />
  </ScalarDropdownButton>
</template>
