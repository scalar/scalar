<script lang="ts" setup>
import { useClipboard } from '@scalar/use-clipboard'
import { computed } from 'vue'

import { type Server } from '../../../types'

const props = defineProps<{
  value?: Server
}>()

const { copyToClipboard } = useClipboard()

const formattedServerUrl = computed(() => {
  const url = props.value?.url ?? ''
  const urlWithoutHtml = url.replace(/(<([^>]+)>)/gi, '')

  /* Replace all variables (example: {{ baseurl }} with an HTML tag) */
  return urlWithoutHtml.replace(
    /{{\s*([\w.-]+)\s*}}/g,
    '<span class="base-url-variable">{{ $1 }}</span>',
  )
})
</script>
<template>
  <template v-if="value">
    <a
      class="base-url"
      :title="value.description"
      @click="copyToClipboard(value.url)"
      v-html="formattedServerUrl" />
  </template>
</template>

<style>
.base-url-variable {
  color: var(--theme-color-3, var(--default-theme-color-3));
}
</style>

<style scoped>
.base-url {
  color: var(--theme-color-1, var(--default-theme-color-1));
  font-size: var(--theme-small, var(--default-theme-small));
  cursor: pointer;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  display: flex;
  padding: 10px 12px;
}
</style>
