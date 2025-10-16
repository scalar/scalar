<script setup lang="ts">
import { ScalarToggle } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type {
  OpenApiDocument,
  SecuritySchemeObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import type { EnvVariable } from '@/store'
import { AuthSelector } from '@/v2/blocks/scalar-auth-selector-block'
import type { UpdateSecuritySchemeEvent } from '@/v2/blocks/scalar-auth-selector-block/event-types'

defineProps<{
  /** Should use document security */
  useDocumentSecurity: boolean

  /** Security requirements for the document */
  security: OpenApiDocument['security']
  /** Currently selected security requirements */
  selectedSecurity: OpenApiDocument['security']
  /** Security schemes available in the document */
  securitySchemes: NonNullable<OpenApiDocument['components']>['securitySchemes']
  /** Currently selected server */
  server: ServerObject | undefined

  /** TODO: remove when we migrate */
  environment: Environment
  envVariables: EnvVariable[]
}>()

const emit = defineEmits<{
  (e: 'update:useDocumentSecurity', value: boolean): void

  // ------- Auth Selector events -------
  (e: 'deleteOperationAuth', names: string[]): void
  (e: 'update:securityScheme', payload: UpdateSecuritySchemeEvent): void
  (
    e: 'update:selectedScopes',
    payload: { id: string[]; name: string; scopes: string[] },
  ): void
  (
    e: 'update:selectedSecurity',
    payload: {
      value: NonNullable<OpenApiDocument['x-scalar-selected-security']>
      create: SecuritySchemeObject[]
    },
  ): void
}>()
</script>

<template>
  <div class="flex h-full w-full flex-col gap-12 px-1.5 pt-8">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex h-8 items-center justify-between">
          <h3 class="font-bold">Authentication</h3>
          <ScalarToggle
            class="w-4"
            :modelValue="useDocumentSecurity"
            @update:modelValue="
              (value) => emit('update:useDocumentSecurity', value)
            " />
        </div>
        <p class="pr-6 text-sm">
          Added authentication will apply to all requests under this collection.
          You can override this by specifying another one in the request.
        </p>
      </div>
      <AuthSelector
        class="scalar-collection-auth"
        :envVariables="envVariables"
        :environment="environment"
        layout="client"
        :security="security"
        :securitySchemes="securitySchemes"
        :selectedSecurity="selectedSecurity"
        :server="server"
        title="Authentication"
        @deleteOperationAuth="(names) => emit('deleteOperationAuth', names)"
        @update:securityScheme="
          (payload) => emit('update:securityScheme', payload)
        "
        @update:selectedScopes="
          (payload) => emit('update:selectedScopes', payload)
        "
        @update:selectedSecurity="
          (payload) => emit('update:selectedSecurity', payload)
        " />
    </div>
  </div>
</template>
<style scoped>
.scalar-collection-auth {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
}
</style>
