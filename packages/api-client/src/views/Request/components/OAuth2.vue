<script setup lang="ts">
import { DataTableRow } from '@/components/DataTable'
import { type UpdateScheme, useWorkspace } from '@/store/workspace'
import RequestAuthDataTableInput from '@/views/Request/RequestSection/RequestAuthDataTableInput.vue'
import { authorizeOauth2 } from '@/views/Request/libs'
import { ScalarButton, useLoadingState } from '@scalar/components'
import type { SecuritySchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'

import OAuthScopesInput from './OAuthScopesInput.vue'

const props = defineProps<{
  scheme: SecuritySchemeOauth2
}>()

const loadingState = useLoadingState()
const { securitySchemeMutators } = useWorkspace()

/** Update the current scheme */
const updateScheme: UpdateScheme = (path, value) =>
  securitySchemeMutators.edit(props.scheme.uid, path, value)

/** Authorize the user using specified flow */
const handleAuthorize = async () => {
  if (loadingState.isLoading) return
  loadingState.startLoading()

  const accessToken = await authorizeOauth2(props.scheme).finally(() =>
    loadingState.stopLoading(),
  )

  if (accessToken) updateScheme('flow.token', accessToken)
}
</script>

<template>
  <!-- Access Token Granted -->
  <template v-if="scheme.flow.token">
    <DataTableRow>
      <RequestAuthDataTableInput
        id="oauth2-access-token"
        class="border-r-transparent"
        :modelValue="scheme.flow.token"
        type="password"
        @update:modelValue="(v) => updateScheme('flow.token', v)">
        Access Token
      </RequestAuthDataTableInput>
    </DataTableRow>
    <DataTableRow class="min-w-full">
      <div class="h-8 flex items-center justify-self-end">
        <ScalarButton
          class="p-0 py-0.5 px-2 mr-1"
          :loading="loadingState"
          size="sm"
          variant="outlined"
          @click="updateScheme('flow.token', '')">
          Clear
        </ScalarButton>
      </div>
    </DataTableRow>
  </template>

  <template v-else>
    <DataTableRow
      v-if="['implicit', 'authorizationCode'].includes(scheme.flow.type)">
      <!-- Redirect URI -->
      <RequestAuthDataTableInput
        id="oauth2-redirect-uri"
        :modelValue="scheme.redirectUri"
        placeholder="https://galaxy.scalar.com/callback"
        @update:modelValue="(v) => updateScheme('redirectUri', v)">
        Redirect URI
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Username and password -->
    <template v-if="scheme.flow.type === 'password'">
      <DataTableRow>
        <RequestAuthDataTableInput
          id="oauth2-password-username"
          class="text-c-2"
          :modelValue="scheme.flow.value"
          placeholder="ScalarEnjoyer01"
          @update:modelValue="(v) => updateScheme('flow.value', v)">
          Username
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          id="oauth2-password-password"
          :modelValue="scheme.flow.secondValue"
          placeholder="XYZ123"
          type="password"
          @update:modelValue="(v) => updateScheme('flow.secondValue', v)">
          Password
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- Client ID -->
    <DataTableRow>
      <RequestAuthDataTableInput
        id="oauth2-client-id"
        :modelValue="scheme.clientId"
        placeholder="12345"
        @update:modelValue="(v) => updateScheme('clientId', v)">
        Client ID
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Client Secret (Authorization Code / Client Credentials / Password (optional)) -->
    <DataTableRow v-if="'clientSecret' in scheme.flow">
      <RequestAuthDataTableInput
        id="oauth2-client-secret"
        :modelValue="scheme.flow.clientSecret"
        placeholder="XYZ123"
        type="password"
        @update:modelValue="(v) => updateScheme('flow.clientSecret', v)">
        Client Secret
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Scopes -->
    <DataTableRow v-if="scheme.flow.scopes">
      <OAuthScopesInput
        :activeFlow="scheme.flow"
        :updateScheme="updateScheme" />
    </DataTableRow>

    <DataTableRow class="min-w-full">
      <div class="h-8 flex items-center justify-self-end">
        <ScalarButton
          class="p-0 py-0.5 px-2 mr-1"
          :loading="loadingState"
          size="sm"
          variant="outlined"
          @click="handleAuthorize">
          Authorize
        </ScalarButton>
      </div>
    </DataTableRow>

    <!-- Open ID Connect -->
    <!-- <DataTableRow -->
    <!--   v-else-if="activeScheme?.type === 'openIdConnect'" -->
    <!--   class="border-r-transparent"> -->
    <!--   <DataTableInput -->
    <!--     v-model="password" -->
    <!--     placeholder="Token"> -->
    <!--     TODO -->
    <!--   </DataTableInput> -->
    <!--   <DataTableCell class="flex items-center"> -->
    <!--     <ScalarButton size="sm"> Authorize </ScalarButton> -->
    <!--   </DataTableCell> -->
    <!-- </DataTableRow> -->
  </template>
</template>
