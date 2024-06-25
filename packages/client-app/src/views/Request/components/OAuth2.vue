<script setup lang="ts">
import { DataTableCell, DataTableRow } from '@/components/DataTable'
import type { UpdateScheme } from '@/store/workspace'
import RequestAuthDataTableInput from '@/views/Request/RequestSection/RequestAuthDataTableInput.vue'
import {
  type SecuritySchemeOptionOauth,
  authorizeOauth2,
} from '@/views/Request/libs'
import { ScalarButton, useLoadingState } from '@scalar/components'
import type { SelectedSchemeOauth2 } from '@scalar/oas-utils/entities/workspace/security'

import OAuthScopesInput from './OAuthScopesInput.vue'

const props = defineProps<{
  activeScheme: SelectedSchemeOauth2
  schemeModel: SecuritySchemeOptionOauth
  updateScheme: UpdateScheme
}>()

const loadingState = useLoadingState()

/** Authorize the user using specified flow */
const handleAuthorize = async () => {
  if (loadingState.isLoading) return
  loadingState.startLoading()

  const accessToken = await authorizeOauth2(
    props.activeScheme,
    props.schemeModel,
  ).finally(() => loadingState.stopLoading())

  if (accessToken)
    props.updateScheme(`flows.${props.schemeModel.flowKey}.token`, accessToken)
}
</script>

<template>
  <!-- Access Token Granted -->
  <DataTableRow v-if="activeScheme.flow.token">
    <RequestAuthDataTableInput
      id="oauth2-access-token"
      class="border-r-transparent"
      :modelValue="activeScheme.flow.token"
      type="password"
      @update:modelValue="
        (v) => updateScheme(`flows.${schemeModel.flowKey}.token`, v)
      ">
      Access Token
    </RequestAuthDataTableInput>
    <DataTableCell class="flex items-center p-0.5">
      <ScalarButton
        size="sm"
        variant="ghost"
        @click="updateScheme(`flows.${schemeModel.flowKey}.token`, '')">
        Clear
      </ScalarButton>
    </DataTableCell>
  </DataTableRow>

  <template v-else>
    <DataTableRow v-if="schemeModel.flowKey !== 'clientCredentials'">
      <!-- Redirect URI -->
      <RequestAuthDataTableInput
        id="oauth2-redirect-uri"
        :modelValue="activeScheme.scheme.redirectUri"
        placeholder="https://galaxy.scalar.com/callback"
        @update:modelValue="(v) => props.updateScheme('redirectUri', v)">
        Redirect URI
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Client ID -->
    <DataTableRow>
      <RequestAuthDataTableInput
        id="oauth2-client-id"
        :modelValue="activeScheme.scheme.clientId"
        placeholder="12345"
        @update:modelValue="(v) => props.updateScheme('clientId', v)">
        Client ID
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Scopes -->
    <DataTableRow v-if="activeScheme.flow.scopes">
      <OAuthScopesInput
        :activeFlow="activeScheme.flow"
        :schemeModel="schemeModel"
        :updateScheme="updateScheme" />
    </DataTableRow>
    <!-- Client Secret (Authorization Code / Client Credentials) -->
    <DataTableRow v-if="'clientSecret' in activeScheme.flow">
      <RequestAuthDataTableInput
        id="oauth2-client-secret"
        :modelValue="activeScheme.flow.clientSecret"
        placeholder="XYZ123"
        type="password"
        @update:modelValue="
          (v) =>
            // Vue cant figure out the type if we check in the template above so we do it here
            (schemeModel.flowKey === 'authorizationCode' ||
              schemeModel.flowKey === 'clientCredentials') &&
            props.updateScheme(`flows.${schemeModel.flowKey}.clientSecret`, v)
        ">
        Client Secret
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow class="min-w-full">
      <div class="h-8 flex items-center justify-self-end">
        <ScalarButton
          :loading="loadingState"
          size="sm"
          @click="handleAuthorize">
          Authorize
        </ScalarButton>
      </div>
    </DataTableRow>

    <!-- Password -->
    <!-- <DataTableRow -->
    <!--   v-if="schemeModel.flowKey === 'password'" -->
    <!--   class="border-r-transparent"> -->
    <!--   <DataTableInput -->
    <!--     :modelValue="activeScheme.clientId" -->
    <!--     placeholder="12345" -->
    <!--     @update:modelValue="(v) => updateScheme('clientId', v)"> -->
    <!--     Client ID -->
    <!--   </DataTableInput> -->
    <!--   <DataTableCell class="flex items-center p-0.5"> -->
    <!--     <ScalarButton size="sm">Authorize</ScalarButton> -->
    <!--   </DataTableCell> -->
    <!-- </DataTableRow> -->

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
./OAuthScopesInput.vue
