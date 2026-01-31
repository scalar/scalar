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
    scheme: SecuritySchemeObject & { type: 'http' }
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

  if (authSecrets?.type !== 'http') {
    return undefined
  }

  return authSecrets
})

type Payload =
  ApiReferenceEvents['auth:update:security-scheme-secrets']['payload'] & {
    type: 'http'
  }

const handleSecuritySchemeSecretsUpdate = (
  payload: Omit<Payload, 'type'>,
): void =>
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: { type: 'http', ...payload },
    name,
  })
</script>

<template>
  <!-- Bearer Token -->
  <DataTableRow v-if="scheme.scheme === 'bearer'">
    <RequestAuthDataTableInput
      :containerClass="isStatic ? 'border-t' : false"
      :environment
      :modelValue="secrets?.['x-scalar-secret-token'] ?? ''"
      placeholder="Token"
      type="password"
      @update:modelValue="
        (v) =>
          handleSecuritySchemeSecretsUpdate({
            'x-scalar-secret-token': v,
          })
      ">
      Bearer Token
    </RequestAuthDataTableInput>
  </DataTableRow>

  <!-- HTTP Basic Authentication -->
  <template v-else-if="scheme?.scheme === 'basic'">
    <DataTableRow>
      <RequestAuthDataTableInput
        class="text-c-2"
        :environment
        :modelValue="secrets?.['x-scalar-secret-username'] ?? ''"
        placeholder="janedoe"
        required
        @update:modelValue="
          (v) =>
            handleSecuritySchemeSecretsUpdate({ 'x-scalar-secret-username': v })
        ">
        Username
      </RequestAuthDataTableInput>
    </DataTableRow>
    <DataTableRow>
      <RequestAuthDataTableInput
        :environment
        :modelValue="secrets?.['x-scalar-secret-password'] ?? ''"
        placeholder="********"
        type="password"
        @update:modelValue="
          (v) =>
            handleSecuritySchemeSecretsUpdate({ 'x-scalar-secret-password': v })
        ">
        Password
      </RequestAuthDataTableInput>
    </DataTableRow>
  </template>
</template>
