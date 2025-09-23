<script setup lang="ts">
import { ScalarButton, useLoadingState } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { pkceOptions } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import type {
  OAuthFlowsObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed } from 'vue'

import { DataTableRow } from '@/components/DataTable'
import { type EnvVariable } from '@/store'
import OAuthScopesInput from '@/v2/blocks/scalar-auth-selector-block/components/OAuthScopesInput.vue'
import type { UpdateSecuritySchemeEvent } from '@/v2/blocks/scalar-auth-selector-block/event-types'
import { authorizeOauth2 } from '@/v2/blocks/scalar-auth-selector-block/helpers/oauth'

import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const {
  environment,
  envVariables,
  flows,
  type,
  server,
  selectedScopes,
  proxyUrl,
} = defineProps<{
  environment: Environment
  envVariables: EnvVariable[]
  flows: OAuthFlowsObject
  type: keyof OAuthFlowsObject
  selectedScopes: string[]
  server: ServerObject | undefined
  proxyUrl: string
}>()

const emits = defineEmits<{
  (e: 'update:selectedScopes', payload: { scopes: string[] }): void
  (
    e: 'update:securityScheme',
    payload: Extract<UpdateSecuritySchemeEvent, { type: 'oauth2' }>['payload'],
  ): void
}>()

const loadingState = useLoadingState()
const { toast } = useToasts()

/** Authorize the user using specified flow */
const handleAuthorize = async () => {
  if (loadingState.isLoading) {
    return
  }
  if (!server) {
    toast('No server selected', 'error')
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
    // Set the access token
    emits('update:securityScheme', { token: accessToken })
  } else {
    console.error(error)
    toast(error?.message ?? 'Failed to authorize', 'error')
  }
}

/** To make prop drilling a little easier */
const dataTableInputProps = {
  environment,
  envVariables,
}

const flow = computed(() => flows[type]!)
</script>

<template>
  <!-- Access Token Granted -->
  <template v-if="flow['x-scalar-secret-token']">
    <DataTableRow>
      <RequestAuthDataTableInput
        v-bind="dataTableInputProps"
        class="border-r-transparent"
        :modelValue="flow['x-scalar-secret-token']"
        placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
        type="password"
        @update:modelValue="
          (v) => emits('update:securityScheme', { token: v })
        ">
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
          @click="emits('update:securityScheme', { token: '' })">
          Clear
        </ScalarButton>
      </div>
    </DataTableRow>
  </template>

  <template v-else>
    <DataTableRow>
      <!-- Auth URL -->
      <RequestAuthDataTableInput
        v-if="'authorizationUrl' in flow"
        v-bind="dataTableInputProps"
        containerClass="border-r-0"
        :modelValue="flow.authorizationUrl"
        placeholder="https://galaxy.scalar.com/authorize"
        @update:modelValue="
          (v) => emits('update:securityScheme', { authUrl: v })
        ">
        Auth URL
      </RequestAuthDataTableInput>

      <!-- Token URL -->
      <RequestAuthDataTableInput
        v-if="'tokenUrl' in flow"
        v-bind="dataTableInputProps"
        :modelValue="flow.tokenUrl"
        placeholder="https://galaxy.scalar.com/token"
        @update:modelValue="
          (v) => emits('update:securityScheme', { tokenUrl: v })
        ">
        Token URL
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow v-if="'x-scalar-secret-redirect-uri' in flow">
      <!-- Redirect URI -->
      <RequestAuthDataTableInput
        v-bind="dataTableInputProps"
        :modelValue="flow['x-scalar-secret-redirect-uri']"
        placeholder="https://galaxy.scalar.com/callback"
        @update:modelValue="
          (v) => emits('update:securityScheme', { redirectUrl: v })
        ">
        Redirect URL
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Username and password -->
    <template
      v-if="
        'x-scalar-secret-username' in flow && 'x-scalar-secret-password' in flow
      ">
      <DataTableRow>
        <RequestAuthDataTableInput
          v-bind="dataTableInputProps"
          class="text-c-2"
          :modelValue="flow['x-scalar-secret-username']"
          placeholder="janedoe"
          @update:modelValue="
            (v) => emits('update:securityScheme', { username: v })
          ">
          Username
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          v-bind="dataTableInputProps"
          :modelValue="flow['x-scalar-secret-password']"
          placeholder="********"
          type="password"
          @update:modelValue="
            (v) => emits('update:securityScheme', { password: v })
          ">
          Password
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- Client ID -->
    <DataTableRow>
      <RequestAuthDataTableInput
        v-bind="dataTableInputProps"
        :modelValue="flow['x-scalar-secret-client-id']"
        placeholder="12345"
        @update:modelValue="
          (v) => emits('update:securityScheme', { clientId: v })
        ">
        Client ID
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Client Secret (Authorization Code / Client Credentials / Password (optional)) -->
    <DataTableRow v-if="'x-scalar-secret-client-secret' in flow">
      <RequestAuthDataTableInput
        v-bind="dataTableInputProps"
        :modelValue="flow['x-scalar-secret-client-secret']"
        placeholder="XYZ123"
        type="password"
        @update:modelValue="
          (v) => emits('update:securityScheme', { clientSecret: v })
        ">
        Client Secret
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- PKCE -->
    <DataTableRow v-if="'x-usePkce' in flow">
      <RequestAuthDataTableInput
        v-bind="dataTableInputProps"
        :enum="pkceOptions"
        :modelValue="flow['x-usePkce']"
        readOnly
        @update:modelValue="
          (v) =>
            emits('update:securityScheme', {
              usePkce: v as (typeof pkceOptions)[number],
            })
        ">
        Use PKCE
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Scopes -->
    <DataTableRow v-if="Object.keys(flow.scopes ?? {}).length">
      <OAuthScopesInput
        :flow="flow"
        :selectedScopes="selectedScopes"
        @update:selectedScopes="(v) => emits('update:selectedScopes', v)" />
    </DataTableRow>
  </template>
  <template v-if="!flow['x-scalar-secret-token']">
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
