<script setup lang="ts">
import type { AuthStore } from '@scalar/workspace-store/entities/auth/index'
import type {
  ApiReferenceEvents,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/security-scheme'
import { computed } from 'vue'

import RequestAuthDataTableInput from '@/v2/blocks/scalar-auth-selector-block/components/RequestAuthDataTableInput.vue'
import DataTableRow from '@/v2/components/data-table/DataTableRow.vue'

const { scheme, isStatic, authStore, documentSlug, name, eventBus } =
  defineProps<{
    /** The security scheme */
    scheme: SecuritySchemeObject & { type: 'apiKey' }
    /** Controls the display of certain borders which are used when we are non-collapsible */
    isStatic: boolean
    /** The current environment configuration */
    environment: XScalarEnvironment
    /** The auth store */
    authStore: AuthStore
    /** The document slug */
    documentSlug: string
    /** The name of the security scheme */
    name: string
    /** The event bus */
    eventBus: WorkspaceEventBus
  }>()

const secrets = computed(() => {
  const authSecrets = authStore.getAuthSecrets(documentSlug, name)

  if (authSecrets?.type !== 'apiKey') {
    return undefined
  }

  return authSecrets
})

type UpdatePayload =
  ApiReferenceEvents['auth:update:security-scheme']['payload'] & {
    type: 'apiKey'
  }
type SecretsPayload =
  ApiReferenceEvents['auth:update:security-scheme-secrets']['payload'] & {
    type: 'apiKey'
  }

const handleSecuritySchemeUpdate = (
  payload: Omit<UpdatePayload, 'type'>,
): void =>
  eventBus.emit('auth:update:security-scheme', {
    payload: { type: 'apiKey', ...payload },
    name,
  })

const handleSecuritySchemeSecretsUpdate = (
  payload: Omit<SecretsPayload, 'type'>,
): void =>
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: { type: 'apiKey', ...payload },
    name,
  })
</script>

<template>
  <DataTableRow>
    <RequestAuthDataTableInput
      :containerClass="isStatic ? 'border-t' : false"
      :environment
      :modelValue="scheme.name"
      placeholder="api-key"
      @update:modelValue="(v) => handleSecuritySchemeUpdate({ name: v })">
      Name
    </RequestAuthDataTableInput>
  </DataTableRow>
  <DataTableRow>
    <RequestAuthDataTableInput
      :environment
      :modelValue="secrets?.['x-scalar-secret-token'] ?? ''"
      placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
      type="password"
      @update:modelValue="
        (v) =>
          handleSecuritySchemeSecretsUpdate({
            'x-scalar-secret-token': v,
          })
      ">
      Value
    </RequestAuthDataTableInput>
  </DataTableRow>
</template>
