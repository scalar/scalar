<script lang="ts" setup>
import { useClipboard } from '@lib/hooks/useClipboard'

defineProps<{ url: string }>()

const { copyToClipboard } = useClipboard()
</script>
<template>
  <div class="tag-endpoints example-item">
    <span class="example-item-title">Base URL</span>
    <div class="example-item-endpoints custom-scroll">
      <a
        class="endpoint"
        @click="copyToClipboard(url)">
        <span style="text-transform: none !important">
          {{ url }}
        </span>
      </a>
    </div>
  </div>
</template>
