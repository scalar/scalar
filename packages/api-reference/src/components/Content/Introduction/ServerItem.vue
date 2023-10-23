<script lang="ts" setup>
import { useClipboard } from '@scalar/use-clipboard'
import { computed } from 'vue'

import type { Server, ServerStateVariable } from '../../../types'

const props = defineProps<{
  value?: Server
  variables?: ServerStateVariable[]
}>()

const { copyToClipboard } = useClipboard()

const formattedServerUrl = computed(() => {
  const url = props.value?.url ?? ''

  /* Remove HTML */
  const urlWithoutHtml = url.replace(/(<([^>]+)>)/gi, '')

  /* Replace all variables (example: {{ baseurl }} with an HTML tag) */
  const regex = /{\s*([\w.-]+)\s*}/g

  /* Loop through all matches and replace the match with the variable value */
  return urlWithoutHtml.replace(regex, (_, p1: string) => {
    const variable = props.variables?.find(
      (currentVariable: ServerStateVariable) => currentVariable.name === p1,
    )

    return `<span class="base-url-variable">${variable?.value ?? ''}</span>`
  })
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
  color: var(--theme-color-1, var(--default-theme-color-1));
}
</style>

<style scoped>
.base-url {
  color: var(--theme-color-2, var(--default-theme-color-2));
  cursor: pointer;
  font-family: var(--theme-font-code, var(--default-theme-font-code));
  display: inline-block;
  padding: 10px 0;
  font-size: var(--theme-micro, var(--default-theme-micro));
}
</style>
