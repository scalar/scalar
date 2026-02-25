<script setup lang="ts">
import { ScalarToggle } from '@scalar/components'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { AuthMeta } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed, ref, watchEffect } from 'vue'

import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import type { CollectionProps } from '@/v2/features/app/helpers/routes'
import { getDefaultOperationSecurityToggle } from '@/v2/features/collection/helpers/get-default-operation-security-toggle'
import Section from '@/v2/features/settings/components/Section.vue'
import { getServers } from '@/v2/helpers'
import { getActiveProxyUrl } from '@/v2/helpers/get-active-proxy-url'

const {
  document,
  eventBus,
  environment,
  securitySchemes,
  workspaceStore,
  documentSlug,
  path,
  method,
  collectionType,
  layout,
} = defineProps<CollectionProps>()

/**
 * Compute the authentication metadata based on the current collection type.
 * If we're working with an operation, include its path and method; otherwise, use the document scope.
 */
const authMeta = computed<AuthMeta>(() => {
  if (collectionType === 'operation') {
    return {
      type: 'operation',
      path: path ?? '',
      method: method ?? 'get',
    }
  }
  return { type: 'document' }
})

/**
 * Compute the operation object based on the current collection type.
 */
const operation = computed(() => {
  if (collectionType === 'operation') {
    // Operation not found
    if (!path || !isHttpMethod(method)) {
      return null
    }
    // Operation found, return the servers
    return getResolvedRef(document?.paths?.[path]?.[method])
  }
  return null
})

/**
 * If enabled we use/set the selected security schemes on the operation level
 */
const useOperationSecurity = ref(false)
watchEffect(() => {
  useOperationSecurity.value = getDefaultOperationSecurityToggle({
    authStore: workspaceStore.auth,
    documentName: documentSlug,
    ...authMeta.value,
  })
})

/** Compute the selected security for the operation or document based on the current collection type */
const selectedSecurity = computed(() => {
  if (collectionType === 'operation') {
    return workspaceStore.auth.getAuthSelectedSchemas({
      type: 'operation',
      documentName: documentSlug,
      path: path ?? '',
      method: method ?? 'get',
    })
  }
  return workspaceStore.auth.getAuthSelectedSchemas({
    type: 'document',
    documentName: documentSlug,
  })
})

/** Compute the security requirements for the operation or document based on the current collection type */
const securityRequirements = computed(() => {
  if (collectionType === 'operation') {
    return operation.value?.security ?? []
  }
  return document?.security ?? []
})

/** Compute the proxy URL for the current layout (for the electron we don't want to use the proxy by default) */
const proxyUrl = computed(
  () =>
    getActiveProxyUrl(
      workspaceStore.workspace['x-scalar-active-proxy'],
      layout,
    ) ?? '',
)

const servers = computed(() => {
  return getServers(operation.value?.servers ?? document?.servers, {
    documentUrl: document?.['x-scalar-original-source-url'],
  })
})

/** Grab the currently selected server for relative auth URIs */
const server = computed(() => {
  const documentServer = document?.['x-scalar-selected-server']
  const operationServer = operation.value?.['x-scalar-selected-server']
  const selectedServerUrl = operationServer ?? documentServer
  return servers.value.find(({ url }) => url === selectedServerUrl) ?? null
})

/**
 * Handles toggling operation-level security authentication. (Only for operation collections)
 * When enabled (`value` is true), overrides document-level authentication for the current operation.
 * When disabled (`value` is false), reverts to using document-level authentication instead.
 */
const handleToggleOperationSecurity = (value: boolean) => {
  // Only toggle for operation collections
  if (authMeta.value.type !== 'operation') {
    return
  }

  // Toggle the operation security
  useOperationSecurity.value = value

  if (value) {
    // Initailize with an empty array of requirements and schemes for operation-level authentication
    // So we can read it from the operation object
    return eventBus.emit('auth:update:selected-security-schemes', {
      selectedRequirements: [],
      newSchemes: [],
      meta: authMeta.value,
    })
  }

  // Clear the operation security so document level authentication is used
  return eventBus.emit('auth:clear:selected-security-schemes', {
    meta: authMeta.value,
  })
}
</script>

<template>
  <Section>
    <template #title>Authentication</template>
    <template #description>
      <template v-if="collectionType === 'operation'">
        <span class="block">
          Override authentication for this operation with the toggle.
        </span>
        <span class="mt-1 block">
          <strong>On</strong> — Authentication below applies only to this
          operation.
        </span>
        <span class="mt-1 block">
          <strong>Off</strong> — This operation uses document-level
          authentication from the OpenAPI spec.
        </span>
      </template>
      <template v-else>
        Configure authentication for this document. Selected authentication
        applies to all operations unless overridden at the operation level.
      </template>
    </template>
    <template
      v-if="collectionType === 'operation'"
      #actions>
      <div class="flex h-8 items-center">
        <ScalarToggle
          class="w-4"
          :modelValue="useOperationSecurity"
          @update:modelValue="handleToggleOperationSecurity" />
      </div>
    </template>

    <!-- Auth Selector -->
    <div
      :class="
        collectionType === 'operation' &&
        !useOperationSecurity &&
        'cursor-not-allowed'
      ">
      <AuthSelector
        class="scalar-collection-auth border-none!"
        :class="
          collectionType === 'operation' &&
          !useOperationSecurity &&
          'pointer-events-none opacity-50 mix-blend-luminosity'
        "
        :environment
        :eventBus="eventBus"
        isStatic
        :meta="authMeta"
        :proxyUrl="proxyUrl"
        :securityRequirements="securityRequirements"
        :securitySchemes
        :selectedSecurity="selectedSecurity"
        :server
        title="Authentication" />
    </div>
  </Section>
</template>
<style scoped>
.scalar-collection-auth {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
}
</style>
