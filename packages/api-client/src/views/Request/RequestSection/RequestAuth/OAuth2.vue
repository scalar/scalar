<script setup lang="ts">
import { DataTableRow } from '@/components/DataTable'
import { type UpdateScheme, useWorkspace } from '@/store/store'
import { authorizeOauth2 } from '@/views/Request/libs'
import { ScalarButton, useLoadingState } from '@scalar/components'
import {
  type Collection,
  type Oauth2Flow,
  type SecuritySchemeOauth2,
  type Server,
  pkceOptions,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { useToasts } from '@scalar/use-toasts'

import OAuthScopesInput from './OAuthScopesInput.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const { scheme, flow, collection, server, workspace } = defineProps<{
  scheme: SecuritySchemeOauth2
  flow: Oauth2Flow
  collection: Collection
  server: Server | undefined
  workspace: Workspace
}>()

const loadingState = useLoadingState()
const { toast } = useToasts()
const { securitySchemeMutators } = useWorkspace()

/** Update the current scheme */
const updateScheme: UpdateScheme = (path, value) =>
  securitySchemeMutators.edit(scheme.uid, path, value)

/** Authorize the user using specified flow */
const handleAuthorize = async () => {
  if (loadingState.isLoading || !collection?.uid) return
  loadingState.startLoading()

  if (!server) {
    toast('No server selected', 'error')
    return
  }

  const [error, accessToken] = await authorizeOauth2(
    flow,
    server,
    workspace?.proxyUrl,
  ).finally(() => loadingState.stopLoading())

  if (accessToken) updateScheme(`flows.${flow.type}.token`, accessToken)
  else {
    console.error(error)
    toast(error?.message ?? 'Failed to authorize', 'error')
  }
}
</script>

<template>
  <!-- Access Token Granted -->
  <template v-if="flow.token">
    <DataTableRow>
      <RequestAuthDataTableInput
        class="border-r-transparent"
        :modelValue="flow.token"
        placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
        type="password"
        @update:modelValue="(v) => updateScheme(`flows.${flow.type}.token`, v)">
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
          @click="updateScheme(`flows.${flow.type}.token`, '')">
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
        :modelValue="flow.authorizationUrl"
        placeholder="https://galaxy.scalar.com/authorize"
        @update:modelValue="
          (v) => updateScheme(`flows.${flow.type}.authorizationUrl`, v)
        ">
        Auth URL
      </RequestAuthDataTableInput>

      <!-- Token URL -->
      <RequestAuthDataTableInput
        v-if="'tokenUrl' in flow"
        :modelValue="flow.tokenUrl"
        placeholder="https://galaxy.scalar.com/token"
        @update:modelValue="
          (v) => updateScheme(`flows.${flow.type}.tokenUrl`, v)
        ">
        Token URL
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow v-if="'x-scalar-redirect-uri' in flow">
      <!-- Redirect URI -->
      <RequestAuthDataTableInput
        :modelValue="flow['x-scalar-redirect-uri']"
        placeholder="https://galaxy.scalar.com/callback"
        @update:modelValue="
          (v) => updateScheme(`flows.${flow.type}.x-scalar-redirect-uri`, v)
        ">
        Redirect URL
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Username and password -->
    <template v-if="flow.type === 'password'">
      <DataTableRow>
        <RequestAuthDataTableInput
          class="text-c-2"
          :modelValue="flow.username"
          placeholder="janedoe"
          @update:modelValue="
            (v) => updateScheme(`flows.${flow.type}.username`, v)
          ">
          Username
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          :modelValue="flow.password"
          placeholder="********"
          type="password"
          @update:modelValue="
            (v) => updateScheme(`flows.${flow.type}.password`, v)
          ">
          Password
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- Client ID -->
    <DataTableRow>
      <RequestAuthDataTableInput
        :modelValue="flow['x-scalar-client-id']"
        placeholder="12345"
        @update:modelValue="
          (v) => updateScheme(`flows.${flow.type}.x-scalar-client-id`, v)
        ">
        Client ID
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Client Secret (Authorization Code / Client Credentials / Password (optional)) -->
    <DataTableRow v-if="'clientSecret' in flow">
      <RequestAuthDataTableInput
        :modelValue="flow.clientSecret"
        placeholder="XYZ123"
        type="password"
        @update:modelValue="
          (v) => updateScheme(`flows.${flow.type}.clientSecret`, v)
        ">
        Client Secret
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- PKCE -->
    <DataTableRow v-if="'x-usePkce' in flow">
      <RequestAuthDataTableInput
        :enum="pkceOptions"
        :modelValue="flow['x-usePkce']"
        readOnly
        @update:modelValue="
          (v) =>
            updateScheme(
              `flows.${flow.type}.x-usePkce`,
              v as (typeof pkceOptions)[number],
            )
        ">
        Use PKCE
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Scopes -->
    <DataTableRow v-if="Object.keys(flow.scopes ?? {}).length">
      <OAuthScopesInput
        :flow="flow"
        :updateScheme="updateScheme" />
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
  <template v-if="!flow.token">
    <DataTableRow class="min-w-full">
      <div class="h-8 flex items-center justify-end border-t-1/2 w-full">
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
  </template>
</template>
