<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  is?: string | Component
}>()
</script>
<template>
  <component
    :is="is ?? 'a'"
    class="relative flex cursor-pointer rounded px-2.5 py-1 font-medium leading text-c-2 no-underline hover:bg-b-2 hover:text-c-1"
    :type="is === 'button' ? 'button' : undefined">
    <slot />
  </component>
</template>
