<script lang="ts" setup>
import { computed } from 'vue'

import { replaceVariables } from '../../../helpers'
import { useClipboard } from '../../../hooks'
import type { Server, Variable } from '../../../types'

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
