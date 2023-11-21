<script setup lang="ts">
import { useClipboard } from '@scalar/use-clipboard'

defineProps<{
  id: string
}>()

const { copyToClipboard } = useClipboard()

const getUrlWithId = (id: string) => {
  const url = new URL(window.location.href)

  url.hash = id

  return url.toString()
}
</script>

<template>
  <div class="anchor">
    <div class="anchor-content">
      <slot />
    </div>
    <button
      class="anchor-action"
      type="button"
      @click="copyToClipboard(getUrlWithId(id))">
      🔗
    </button>
  </div>
</template>

<style>
.anchor {
  display: flex;
  gap: 8px;
}
</style>
