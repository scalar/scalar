<script setup lang="ts">
import { ScalarMarkdown } from '@scalar/components/markdown'
import type {
  AsyncApiDocument,
  AsyncApiOperationObject,
  AsyncApiSecuritySchemeObject,
} from '@scalar/types/asyncapi/3.1'
import { getAsyncApiSecuritySchemes } from '@scalar/workspace-store/channel-example'
import { computed } from 'vue'

import { useLocalization } from '@/features/localization'

import { getAsyncApiRequiredSecurity } from './helpers/get-async-api-required-security'

const { document, operation, operationName } = defineProps<{
  operationName: string
  document: AsyncApiDocument
  operation: AsyncApiOperationObject | null | undefined
}>()
const { translate } = useLocalization()

/** Keep scope-free alternatives visible alongside OAuth requirements. */
type SecurityAlternative = {
  name: string
  scopes: string[]
  scheme: AsyncApiSecuritySchemeObject | undefined
}

const alternatives = computed<SecurityAlternative[]>(() => {
  const definitions = getAsyncApiSecuritySchemes(document, {
    servers: {},
    operations: operation ? { [operationName]: operation } : {},
  })
  return getAsyncApiRequiredSecurity(
    document,
    operation,
    operationName,
  ).requirements.flatMap((group) =>
    group.schemes.map(({ name, scopes }) => ({
      name,
      scopes,
      scheme: definitions[name],
    })),
  )
})
</script>

<template>
  <div
    v-if="alternatives.length"
    class="mt-6 flex flex-col gap-3 text-sm">
    <div class="text-c-1 text-lg font-medium">
      {{ translate('authentication.title') }}
    </div>
    <p
      v-if="alternatives.length > 1"
      class="text-c-2">
      {{ translate('authentication.oneOf') }}
    </p>
    <ul class="flex flex-col gap-3">
      <li
        v-for="(alternative, index) in alternatives"
        :key="index"
        class="flex flex-col gap-1 wrap-anywhere">
        <span class="font-medium">{{ alternative.name }}</span>
        <span
          v-if="alternative.scheme"
          class="text-c-2">
          {{ alternative.scheme.type }}
          <template v-if="alternative.scheme.type === 'http'">{{
            alternative.scheme.scheme
          }}</template>
          <template v-if="alternative.scheme.type === 'httpApiKey'">
            {{ alternative.scheme.in }}: {{ alternative.scheme.name }}
          </template>
        </span>
        <ScalarMarkdown
          v-if="alternative.scheme?.description"
          :value="alternative.scheme.description" />
        <template v-if="alternative.scopes.length">
          <span>{{ translate('authentication.scopes') }}</span>
          <ul class="font-code text-c-2">
            <li
              v-for="scope in alternative.scopes"
              :key="scope">
              {{ scope }}
            </li>
          </ul>
        </template>
      </li>
    </ul>
  </div>
</template>
