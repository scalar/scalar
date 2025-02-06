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

import { getHarRequest } from './get-har-request'

const { target, client, operation, server, example, securitySchemes } =
  defineProps<{
    target: TargetId
    client: ClientId<TargetId>
    operation?: Operation
    server?: Server
    example?: RequestExample
    securitySchemes?: SecurityScheme[]
  }>()

/** Generated code example */
const content = computed(
  // () => getHarRequest({ operation, server, example, securitySchemes }),
  () =>
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
    :hideCredentials="['TODO']"
    :lang="language"
    lineNumbers />
</template>
