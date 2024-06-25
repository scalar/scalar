<script lang="ts" setup>
import { replaceVariables } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

import { useClipboard } from '../../hooks'
import type { Server, ServerVariableValues } from './types'

const props = defineProps<{
  server?: Server
  variables?: ServerVariableValues
}>()

const { copyToClipboard } = useClipboard()

const formattedServerUrl = computed(() => {
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

/**
 * We don’t want to just replace all variables, but keep variables without a server.
 *
 * Examples:
 *  - `https://example.com/{foo}` (without foo) should return `https://example.com/{foo}`
 *  - `https://example.com/{foo}` (with foo: 123) should return `https://example.com/123`
 *
 * So we just what we did above, but strip the HTML.
 */
const plainTextUrl = computed(() =>
  formattedServerUrl.value.replace(/(<([^>]+)>)/gi, ''),
)
</script>
<template>
  <template v-if="server">
    <a
      class="base-url"
      :title="server.description"
      @click="copyToClipboard(plainTextUrl)"
      v-html="formattedServerUrl" />
  </template>
</template>

<style>
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
  padding: 10px 0;
  font-size: var(--scalar-micro);
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
