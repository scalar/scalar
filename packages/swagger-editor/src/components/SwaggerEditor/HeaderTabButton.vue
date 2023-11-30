<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

defineProps<{
  title: string
  mobileTitle?: string
}>()

const isMobile = useMediaQuery('(max-width: 1000px)')
</script>
<template>
  <button
    class="swagger-editor-title"
    type="button">
    <div class="swagger-editor-type">
      {{ isMobile && mobileTitle ? mobileTitle : title }}
    </div>
  </button>
</template>
<style scoped></style>
