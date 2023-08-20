<script lang="ts" setup>
import { useClipboard } from '@scalar/use-clipboard'

defineProps<{
  server?: {
    url: string
    description?: string
  }
}>()

const { copyToClipboard } = useClipboard()
</script>
<template>
  <template v-if="server">
    <a
      class="base-url"
      :title="server.description"
      @click="copyToClipboard(server.url)">
      {{ server.url }}
    </a>
  </template>
</template>
<style scoped>
.base-url {
  color: var(--theme-color-2);
  font-size: var(--theme-micro);
  cursor: pointer;
  display: flex;
  font-family: var(--theme-font-code);
  flex-direction: column;
}
</style>
