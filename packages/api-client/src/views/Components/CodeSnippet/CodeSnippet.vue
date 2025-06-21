<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components'
import type {
  Operation,
  RequestExample,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { isDefined } from '@scalar/oas-utils/helpers'
import type { ClientId, TargetId } from '@scalar/snippetz'
import { computed } from 'vue'

import type { EnvVariables } from '@/libs/env-helpers'
import { getHarRequest, getSnippet } from '@/views/Components/CodeSnippet'

const {
  target,
  client,
  operation,
  server,
  example,
  securitySchemes = [],
  environment,
} = defineProps<{
  target: TargetId
  client: ClientId<TargetId>
  operation?: Operation | undefined
  server?: Server | undefined
  example?: RequestExample | undefined
  securitySchemes?: SecurityScheme[]
  environment?: EnvVariables | undefined
}>()

/**  Block secrets from being shown in the code block */
const secretCredentials = computed(() =>
  securitySchemes.flatMap((scheme) => {
    if (scheme.type === 'apiKey') {
      return scheme.value
    }
    if (scheme?.type === 'http') {
      return [
        scheme.token,
        scheme.password,
        btoa(`${scheme.username}:${scheme.password}`),
      ]
    }
    if (scheme.type === 'oauth2') {
      return Object.values(scheme.flows)
        .map((flow) => flow?.token)
        .filter(isDefined)
    }

    return []
  }),
)

/** Generated code example */
const content = computed(() => {
  const harRequest = getHarRequest({
    operation,
    example,
    server,
    securitySchemes,
    environment,
  })

  const [error, payload] = getSnippet(target, client, harRequest)
  return { error, payload }
})

/** CodeMirror syntax highlighting language */
const language = computed(() => {
  // Normalize languages
  if (target === 'shell' && client === 'curl') {
    return 'curl'
  }
  // TODO: js -> javascript?

  return target ?? 'plaintext'
})
</script>
<template>
  <div
    v-if="content.error"
    class="text-c-3 flex min-h-16 items-center justify-center px-4 text-sm">
    {{ content.error.message }}
  </div>
  <ScalarCodeBlock
    v-else-if="content.payload"
    class="w-full"
    :content="content.payload"
    :hideCredentials="secretCredentials"
    :lang="language"
    lineNumbers />
</template>
