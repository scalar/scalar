<script setup lang="ts">
import {
  AuthSelector,
  type MergedSecuritySchemes,
} from '@scalar/api-client/v2/blocks/scalar-auth-selector-block'
import {
  getSecurityRequirements,
  getSelectedSecurity,
} from '@scalar/api-client/v2/features/operation'
import type { ApiReferenceConfigurationRaw } from '@scalar/types/api-reference'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { ServerObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { WorkspaceDocument } from '@scalar/workspace-store/schemas/workspace'
import { useFocusWithin } from '@vueuse/core'
import { computed, shallowRef, watch } from 'vue'

import { authStorage, restoreAuthSecretsFromStorage } from '@/helpers'
import { useState } from '@/state/state'

const { document, name, environment, eventBus, options, securitySchemes } =
  defineProps<{
    options: Pick<
      ApiReferenceConfigurationRaw,
      'authentication' | 'persistAuth' | 'proxyUrl'
    >
    name: string
    document: WorkspaceDocument | undefined
    eventBus: WorkspaceEventBus
    securitySchemes: MergedSecuritySchemes
    selectedServer: ServerObject | null
    environment: XScalarEnvironment
  }>()

const { workspaceStore } = useState()

/** Compute what the security requirements should be for the document */
const securityRequirements = computed(() =>
  getSecurityRequirements(document?.security),
)

/** The selected security keys for the document */
const selectedSecurity = computed(() =>
  getSelectedSecurity(
    document?.['x-scalar-selected-security'],
    undefined,
    securityRequirements.value,
  ),
)

watch(
  [() => selectedSecurity, () => securitySchemes],
  () => {
    const authPersistence = authStorage()

    authPersistence.setSchemas(name, securitySchemes)

    if (selectedSecurity.value) {
      authPersistence.setSelectedSchemes(name, {
        'x-scalar-selected-security': selectedSecurity.value,
      })
    }

    restoreAuthSecretsFromStorage({ documentName: name, workspaceStore })
  },
  { deep: true },
)

const focusRef = shallowRef()
const { focused } = useFocusWithin(focusRef)

watch(focused, (isFocused) => {
  if (!isFocused) return

  workspaceStore.update('x-scalar-active-document', name)
})
</script>
<template>
  <div
    ref="focusRef"
    tabindex="0">
    <AuthSelector
      v-if="Object.keys(securitySchemes).length"
      :environment
      :eventBus
      isReadOnly
      isStatic
      layout="reference"
      :meta="{ type: 'document' }"
      :persistAuth="options.persistAuth"
      :proxyUrl="options.proxyUrl ?? ''"
      :securityRequirements
      :securitySchemes
      :selectedSecurity
      :server="selectedServer"
      title="Authentication" />
  </div>
</template>
