<script setup lang="ts">
import type { AnyApiReferenceConfiguration } from '@scalar/types/api-reference'
import { DOCUMENT_ROOT_SYMBOL } from '@scalar/use-hooks/useDocumentRoot'
import { provideToasts } from '@scalar/use-toasts'
import { provide, useShadowRoot } from 'vue'

import ApiReference from './ApiReference.vue'

const { configuration } = defineProps<{
  /** The same configuration object accepted by the Vue and standalone integrations. */
  configuration?: AnyApiReferenceConfiguration
}>()
provideToasts()
const root = useShadowRoot()
if (root) {
  provide(DOCUMENT_ROOT_SYMBOL, root)
}
</script>

<template>
  <ApiReference :configuration="configuration" />
</template>
