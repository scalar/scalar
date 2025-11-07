<script setup lang="ts">
import { ScalarButton, useLoadingState } from '@scalar/components'
import { pkceOptions } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  OAuthFlowsObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { DataTableRow } from '@/components/DataTable'
import OAuthScopesInput from '@/v2/blocks/scalar-auth-selector-block/components/OAuthScopesInput.vue'
import { authorizeOauth2 } from '@/v2/blocks/scalar-auth-selector-block/helpers/oauth'

import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const { environment, flows, type, selectedScopes, server, proxyUrl } =
  defineProps<{
    environment: XScalarEnvironment
    flows: OAuthFlowsObject
    type: keyof OAuthFlowsObject
    selectedScopes: string[]
    server: ServerObject | undefined
    proxyUrl: string
  }>()

const emits = defineEmits<{
  'update:selectedScopes': [payload: { scopes: string[] }]
  'update:securityScheme': [payload: OAuth2UpdatePayload]
}>()

const loadingState = useLoadingState()
const { toast } = useToasts()

/** The current OAuth flow based on the selected type */
const flow = computed(() => flows[type]!)

/** Updates the security scheme with new values */
const updateSecurityScheme = (payload: OAuth2UpdatePayload) =>
  emits('update:securityScheme', payload)

/**
 * Authorizes the user using the specified OAuth flow.
 * Opens the appropriate OAuth dialog and/or performs the token exchange.
 */
const handleAuthorize = async (): Promise<void> => {
  if (loadingState.isLoading) {
    return
  }

  loadingState.startLoading()

  const [error, accessToken] = await authorizeOauth2(
    flows,
    type,
    selectedScopes,
    server,
    proxyUrl,
  ).finally(() => loadingState.stopLoading())

  if (accessToken) {
    updateSecurityScheme({ token: accessToken })
  } else {
    console.error(error)
    toast(error?.message ?? 'Failed to authorize', 'error')
  }
}
</script>

<template>
  <!-- Access Token Display: Shows when user is already authorized -->
  <template v-if="Boolean(flow['x-scalar-secret-token'])">
    <DataTableRow>
      <RequestAuthDataTableInput
        class="border-r-transparent"
        :environment
        :modelValue="flow['x-scalar-secret-token']"
        placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
        type="password"
        @update:modelValue="(v) => updateSecurityScheme({ token: v })">
        Access Token
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow class="min-w-full">
      <div class="flex h-8 items-center justify-end gap-2 border-t">
        <ScalarButton
          class="mr-1 p-0 px-2 py-0.5"
          :loading="loadingState"
          size="sm"
          variant="outlined"
          @click="() => updateSecurityScheme({ token: '' })">
          Clear
        </ScalarButton>
      </div>
    </DataTableRow>
  </template>

  <!-- Authorization Form: Shows when user needs to authorize -->
  <template v-else>
    <DataTableRow>
      <RequestAuthDataTableInput
        v-if="'authorizationUrl' in flow"
        containerClass="border-r-0"
        :environment
        :modelValue="flow.authorizationUrl"
        placeholder="https://galaxy.scalar.com/authorize"
        @update:modelValue="(v) => updateSecurityScheme({ authUrl: v })">
        Auth URL
      </RequestAuthDataTableInput>

      <RequestAuthDataTableInput
        v-if="'tokenUrl' in flow"
        :environment
        :modelValue="flow.tokenUrl"
        placeholder="https://galaxy.scalar.com/token"
        @update:modelValue="(v) => updateSecurityScheme({ tokenUrl: v })">
        Token URL
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow v-if="'x-scalar-secret-redirect-uri' in flow">
      <RequestAuthDataTableInput
        :environment
        :modelValue="flow['x-scalar-secret-redirect-uri']"
        placeholder="https://galaxy.scalar.com/callback"
        @update:modelValue="(v) => updateSecurityScheme({ redirectUrl: v })">
        Redirect URL
      </RequestAuthDataTableInput>
    </DataTableRow>

    <template
      v-if="
        'x-scalar-secret-username' in flow && 'x-scalar-secret-password' in flow
      ">
      <DataTableRow>
        <RequestAuthDataTableInput
          class="text-c-2"
          :environment
          :modelValue="flow['x-scalar-secret-username']"
          placeholder="janedoe"
          @update:modelValue="(v) => updateSecurityScheme({ username: v })">
          Username
        </RequestAuthDataTableInput>
      </DataTableRow>

      <DataTableRow>
        <RequestAuthDataTableInput
          :environment
          :modelValue="flow['x-scalar-secret-password']"
          placeholder="********"
          type="password"
          @update:modelValue="(v) => updateSecurityScheme({ password: v })">
          Password
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <DataTableRow>
      <RequestAuthDataTableInput
        :environment
        :modelValue="flow['x-scalar-secret-client-id']"
        placeholder="12345"
        @update:modelValue="(v) => updateSecurityScheme({ clientId: v })">
        Client ID
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow v-if="'x-scalar-secret-client-secret' in flow">
      <RequestAuthDataTableInput
        :environment
        :modelValue="flow['x-scalar-secret-client-secret']"
        placeholder="XYZ123"
        type="password"
        @update:modelValue="(v) => updateSecurityScheme({ clientSecret: v })">
        Client Secret
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow v-if="'x-usePkce' in flow">
      <RequestAuthDataTableInput
        :enum="pkceOptions"
        :environment
        :modelValue="flow['x-usePkce']"
        readOnly
        @update:modelValue="
          (v) =>
            updateSecurityScheme({
              usePkce: v as (typeof pkceOptions)[number],
            })
        ">
        Use PKCE
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow v-if="Object.keys(flow.scopes ?? {}).length">
      <OAuthScopesInput
        :flow
        :selectedScopes
        @update:selectedScopes="(v) => emits('update:selectedScopes', v)" />
    </DataTableRow>

    <DataTableRow class="min-w-full">
      <div class="flex h-8 w-full items-center justify-end border-t">
        <ScalarButton
          class="mr-0.75 p-0 px-2 py-0.5"
          :loading="loadingState"
          size="sm"
          variant="outlined"
          @click="handleAuthorize">
          Authorize
        </ScalarButton>
      </div>
    </DataTableRow>
  </template>
</template>
