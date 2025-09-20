<script setup lang="ts">
import { ScalarButton, useLoadingState } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { pkceOptions, type Server } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import type { Dereference } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SecuritySchemeObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'

import { DataTableRow } from '@/components/DataTable'
import { type EnvVariable } from '@/store'
import OAuthScopesInput from '@/v2/blocks/scalar-auth-selector-block/components/OAuthScopesInput.vue'
import type { UpdateSecuritySchemeEvent } from '@/v2/blocks/scalar-auth-selector-block/event-types'

// import { authorizeOauth2 } from '@/views/Request/libs'

// import OAuthScopesInput from './OAuthScopesInput.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

type OAuth2 = Extract<Dereference<SecuritySchemeObject>, { type: 'oauth2' }>

const { environment, envVariables, flow, server, selectedScopes, proxyUrl } =
  defineProps<{
    environment: Environment
    envVariables: EnvVariable[]
    flow: NonNullable<OAuth2['flows'][keyof OAuth2['flows']]>
    selectedScopes: string[]
    server: Server | undefined
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

// TODO: handle authorization
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

  // TODO: Handle authorization
  // const [error, accessToken] = await authorizeOauth2(
  //   flow,
  //   server,
  //   proxyUrl,
  // ).finally(() => loadingState.stopLoading())

  // if (accessToken) {
  //   updateScheme(`token`, accessToken)
  // } else {
  //   console.error(error)
  //   toast(error?.message ?? 'Failed to authorize', 'error')
  // }
}

/** To make prop drilling a little easier */
const dataTableInputProps = {
  environment,
  envVariables,
}
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

    <DataTableRow v-if="'x-scalar-redirect-uri' in flow">
      <!-- Redirect URI -->
      <RequestAuthDataTableInput
        v-bind="dataTableInputProps"
        :modelValue="flow['x-scalar-redirect-uri']"
        placeholder="https://galaxy.scalar.com/callback"
        @update:modelValue="
          (v) => emits('update:securityScheme', { redirectUrl: v })
        ">
        Redirect URL
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Username and password -->
    <template v-if="'x-scalar-username' in flow && 'x-scalar-password' in flow">
      <DataTableRow>
        <RequestAuthDataTableInput
          v-bind="dataTableInputProps"
          class="text-c-2"
          :modelValue="flow['x-scalar-username']"
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
          :modelValue="flow['x-scalar-password']"
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
        :modelValue="flow['x-scalar-client-id']"
        placeholder="12345"
        @update:modelValue="
          (v) => emits('update:securityScheme', { clientId: v })
        ">
        Client ID
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Client Secret (Authorization Code / Client Credentials / Password (optional)) -->
    <DataTableRow v-if="'x-scalar-client-secret' in flow">
      <RequestAuthDataTableInput
        v-bind="dataTableInputProps"
        :modelValue="flow['x-scalar-client-secret']"
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
