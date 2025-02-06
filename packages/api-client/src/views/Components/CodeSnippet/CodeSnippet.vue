<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components'
import type {
  Operation,
  RequestExample,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
import { computed } from 'vue'

import { getHarRequest } from './helpers/get-har-request'

const {
  target,
  client,
  operation,
  server,
  example,
  securitySchemes = [],
} = defineProps<{
  target: TargetId
  client: ClientId<TargetId>
  operation?: Operation
  server?: Server
  example?: RequestExample
  securitySchemes?: SecurityScheme[]
}>()

/**  Block secrets from being shown in the code block */
const secretCredentials = computed(() =>
  securitySchemes.flatMap((scheme) => {
    if (scheme.type === 'apiKey') return scheme.value
    if (scheme?.type === 'http')
      return [
        scheme.token,
        scheme.password,
        btoa(`${scheme.username}:${scheme.password}`),
      ]
    if (scheme.type === 'oauth2')
      return Object.values(scheme.flows).map((flow) => flow.token)

    return []
  }),
)

/** Generated code example */
const content = computed(() =>
  snippetz().print(
    target,
    client,
    getHarRequest({ operation, server, example, securitySchemes }),
  ),
)

/** CodeMirror syntax highlighting language */
const language = computed(() => {
  // Normalize languages
  if (target === 'shell' && client === 'curl') return 'curl'
  // TODO: js -> javascript?

  return target ?? 'plaintext'
})
</script>
<template>
  <ScalarCodeBlock
    v-if="content"
    class="w-full"
    :content="content"
    :hideCredentials="secretCredentials"
    :lang="language"
    lineNumbers />
</template>
