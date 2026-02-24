<script setup lang="ts">
import { ScalarToggle } from '@scalar/components'
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import type { AuthMeta } from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import { computed, ref } from 'vue'

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

/** If enabled we use/set the selected security schemes on the document level */
const useOperationSecurity = ref(
  getDefaultOperationSecurityToggle({
    authStore: workspaceStore.auth,
    documentName: documentSlug,
    ...authMeta.value,
  }),
)

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

const securityRequirements = computed(() => {
  if (collectionType === 'operation') {
    return operation.value?.security ?? []
  }
  return document?.security ?? []
})

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
  const selectedServerUrl =
    operation.value?.['x-scalar-selected-server'] ??
    document?.['x-scalar-selected-server']
  return servers.value.find(({ url }) => url === selectedServerUrl) ?? null
})

const handleToggleOperationSecurity = (value: boolean) => {
  // Only toggle for operation collections
  if (collectionType !== 'operation' || !path || !isHttpMethod(method)) {
    return
  }
  // Toggle the operation security
  useOperationSecurity.value = value

  if (value) {
    // Set the operation security
    return eventBus.emit('auth:update:selected-security-schemes', {
      selectedRequirements: [],
      newSchemes: [],
      meta: {
        type: 'operation',
        path,
        method,
      },
    })
  }

  // Clear the operation security so document level authentication is used
  return eventBus.emit('auth:clear:selected-security-schemes', {
    meta: {
      type: 'operation',
      path,
      method,
    },
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
