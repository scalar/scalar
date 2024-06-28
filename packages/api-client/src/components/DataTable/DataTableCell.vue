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
    class="min-h-8 border-l-0 border-t-0 border-b-1/2 border-r-1/2 flex text-sm last:border-r-0 group-last:border-b-transparent p-0 m-0"
    role="cell">
    <slot />
  </component>
</template>
