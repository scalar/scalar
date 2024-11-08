<script setup lang="ts">
import { useLayout } from '@/hooks'

const { layout } = useLayout()
</script>
<template>
  <ul
    class="flex gap-1.5"
    :class="layout === 'web' ? 'sm:gap-px sm:px-2' : 'sm:flex-col'">
    <slot />
  </ul>
</template>
