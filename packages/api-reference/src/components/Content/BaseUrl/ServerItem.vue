<script lang="ts" setup>
import {
  type Server,
  type Variable,
  replaceVariables,
} from '@scalar/api-client'
import { computed } from 'vue'

import { useClipboard } from '../../../hooks'

const props = defineProps<{
  value?: Server
  variables?: Variable[]
}>()

const { copyToClipboard } = useClipboard()

const formattedServerUrl = computed(() => {
  const url = props.value?.url ?? ''

  /* Remove HTML */
  const urlWithoutHtml = url.replace(/(<([^>]+)>)/gi, '')

  return replaceVariables(urlWithoutHtml, (match: string) => {
    const variable = props.variables?.find(
      (currentVariable: Variable) => currentVariable.name === match,
    )

    return `<span class="base-url-variable">${
      (variable?.value ?? '') !== '' ? variable?.value : `{${match}}`
    }</span>`
  })
})

/**
 * We don’t want to just replace all variables, but keep variables without a value.
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
  <template v-if="value">
    <a
      class="base-url"
      :title="value.description"
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
