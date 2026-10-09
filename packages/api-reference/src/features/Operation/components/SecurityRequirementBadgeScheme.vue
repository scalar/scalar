<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'
import type { RequiredSecurityScheme } from '@/features/Operation/helpers/get-required-security'

const { scheme } = defineProps<{
  scheme: RequiredSecurityScheme
}>()

const { translate } = useLocalization()

const typeLabel = computed(() => {
  const definition = scheme.scheme
  switch (definition?.type) {
    case 'apiKey':
      return translate('authentication.apiKey')
    case 'http':
      return `HTTP ${definition.scheme}`
    case 'oauth2':
      return 'OAuth 2.0'
    case 'openIdConnect':
      return 'OpenID Connect'
    case 'mutualTLS':
      return translate('authentication.mutualTLS')
    default:
      return undefined
  }
})

const apiKeyInstruction = computed(() => {
  const definition = scheme.scheme
  if (definition?.type !== 'apiKey') {
    return undefined
  }
  const params = { name: definition.name }
  switch (definition.in) {
    case 'cookie':
      return translate('authentication.apiKeyCookie', params)
    case 'header':
      return translate('authentication.apiKeyHeader', params)
    case 'query':
      return translate('authentication.apiKeyQuery', params)
    default:
      return undefined
  }
})
</script>
<template>
  <li class="flex min-w-0 flex-col gap-1.5">
    <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <!-- Keep the component key recognizable, even when its type has a friendlier label. -->
      <span
        class="font-medium"
        :class="{ 'line-through': scheme.scheme?.deprecated }">
        {{ scheme.name }}
      </span>
      <span
        v-if="typeLabel"
        class="text-c-2">
        {{ typeLabel }}
      </span>
    </div>
    <p v-if="apiKeyInstruction">{{ apiKeyInstruction }}</p>
    <ScalarMarkdown
      v-if="scheme.scheme?.description"
      class="text-c-2"
      :value="scheme.scheme.description" />
    <ul
      v-if="scheme.scopes.length"
      class="flex flex-col gap-1">
      <li
        v-for="scope in scheme.scopes"
        :key="scope"
        class="font-code text-c-2">
        {{ scope }}
      </li>
    </ul>
  </li>
</template>
