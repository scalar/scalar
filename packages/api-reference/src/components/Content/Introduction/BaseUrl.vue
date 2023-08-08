<script lang="ts" setup>
import { useClipboard } from '@scalar/use-clipboard'

defineProps<{ url?: string | null }>()

const { copyToClipboard } = useClipboard()
</script>
<template>
  <a
    v-if="url"
    class="endpoint"
    @click="copyToClipboard(url)">
    <span style="text-transform: none !important">
      {{ url }}
    </span>
  </a>
</template>
