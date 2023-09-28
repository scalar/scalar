<script lang="ts" setup>
import { useClipboard } from '@scalar/use-clipboard'
import { computed } from 'vue'

const props = defineProps<{
  server?: {
    url: string
    description?: string
  }
}>()

const { copyToClipboard } = useClipboard()

const formattedServerUrl = computed(() => {
  const url = props.server?.url ?? ''
  const urlWithoutHtml = url.replace(/(<([^>]+)>)/gi, '')

  /* Replace all variables (example: {{ baseurl }} with an HTML tag) */
  return urlWithoutHtml.replace(
    /{{\s*([\w.-]+)\s*}}/g,
    '<span class="base-url-variable">{{ $1 }}</span>',
  )
})
</script>
<template>
  <template v-if="server">
    <a
      class="base-url"
      :title="server.description"
      @click="copyToClipboard(server.url)"
      v-html="formattedServerUrl" />
  </template>
</template>

<style>
.base-url-variable {
  color: var(--theme-color-disabled, var(--default-theme-color-disabled));
}
</style>

<style scoped>
.base-url {
  color: var(--theme-color-2, var(--default-theme-color-2));
  font-size: var(--theme-small, var(--default-theme-small));
  cursor: pointer;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  flex-direction: column;
}
</style>
