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
    class="min-h-[31px] min-w-0 border-b-[.5px] border-r-[.5px] border-r-[inherit] text-sm last:border-r-0 group-last:border-b-transparent"
    role="cell">
    <slot />
  </component>
</template>
