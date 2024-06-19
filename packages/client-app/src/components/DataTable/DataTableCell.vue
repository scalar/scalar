<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    is?: string | Component
  }>(),
  { is: 'td' },
)
</script>
<template>
  <component
    :is="is"
    class="h-8 border-b-1/2 border-r-1/2 text-sm last:border-r-0 group-last:border-b-transparent"
    role="cell">
    <slot />
  </component>
</template>
