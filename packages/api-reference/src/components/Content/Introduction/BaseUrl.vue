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
  color: var(--scalar-api-reference-theme-color-2);
  font-size: var(--scalar-api-reference-theme-mini);
  cursor: pointer;
  display: flex;
  font-family: var(--scalar-api-reference-theme-font-code);
  flex-direction: column;
}
</style>
