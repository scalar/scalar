<script lang="ts" setup>
import { ScalarIcon } from '@scalar/components'
import { computed, inject } from 'vue'

import {
  INTEGRATION_SYMBOL,
  OPENAPI_DOCUMENT_URL_SYMBOL,
  makeUrlAbsolute,
} from '../helpers'

/** Retrieve the OpenAPI document URL from the configuration */
const getOpenApiDocumentUrlSymbol = inject(OPENAPI_DOCUMENT_URL_SYMBOL)
const getIntegrationSymbol = inject(INTEGRATION_SYMBOL)

/** Link to import an OpenAPI document */
const href = computed(() => {
  const isDevelopment = import.meta.env.MODE === 'development'

  const link = new URL(
    isDevelopment ? 'http://localhost:5065' : 'https://client.scalar.com',
  )

  const url = makeUrlAbsolute(getOpenApiDocumentUrlSymbol?.())

  if (url?.length) {
    link.searchParams.set('url', url)
  }

  const integration = getIntegrationSymbol?.()
  if (integration) {
    link.searchParams.set('integration', integration)
  }

  return link.toString()
})
</script>

<template>
  <a
    v-if="getOpenApiDocumentUrlSymbol?.()"
    class="open-api-client-button"
    :href="href"
    target="_blank">
    <ScalarIcon
      icon="ExternalLink"
      size="xs"
      thickness="2.5" />
    Open API Client
  </a>
</template>

<style scoped>
.open-api-client-button {
  width: 100%;
  padding: 9px 12px;
  height: 31px;
  display: block;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  line-height: 1.385;
  text-decoration: none;
  border-radius: var(--scalar-radius);
  box-shadow: 0 0 0 0.5px var(--scalar-border-color);
  margin-bottom: 12px;
  gap: 6px;
  color: var(--scalar-sidebar-color-1);
}

.open-api-client-button:hover {
  background: var(
    --scalar-sidebar-item-hover-background,
    var(--scalar-background-2)
  );
}
</style>
