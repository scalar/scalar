<script lang="ts" setup>
import { replaceVariables } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

import type { Server, ServerVariableValues } from './types'

const props = defineProps<{
  server?: Server
  variables?: ServerVariableValues
}>()

/** Server url with HTML to highlight variables */
const formattedServerUrl = computed(() => {
  // Get the server URL
  const url = props.server?.url ?? ''

  // Remove HTML
  const urlWithoutHtml = url.replace(/(<([^>]+)>)/gi, '')

  // Replace variables with values (if available)
  return replaceVariables(urlWithoutHtml, (matchedVariable: string) => {
    const value = props.variables?.[matchedVariable] ?? ''

    return `<span class="base-url-variable">${
      value !== '' ? value : `{${matchedVariable}}`
    }</span>`
  })
})
</script>
<template>
  <template v-if="server">
    <a
      class="base-url"
      :title="server.description"
      v-html="formattedServerUrl" />
  </template>
</template>

<style>
/* This variable is only added through code and must not be scoped. */
.base-url-variable {
  color: var(--scalar-color-1);
}
</style>

<style scoped>
.base-url {
  color: var(--scalar-color-2);
  cursor: pointer;
  font-family: var(--scalar-font-code);
  display: inline-block;
  font-size: var(--scalar-micro);
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
