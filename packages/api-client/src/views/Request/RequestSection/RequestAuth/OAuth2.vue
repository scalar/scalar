<script setup lang="ts">
import { ScalarButton, useLoadingState } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import {
  pkceOptions,
  type Collection,
  type Oauth2Flow,
  type SecuritySchemeOauth2,
  type Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import { useToasts } from '@scalar/use-toasts'

import { DataTableRow } from '@/components/DataTable'
import type { EnvVariable } from '@/store/active-entities'
import { useWorkspace, type UpdateScheme } from '@/store/store'
import { authorizeOauth2 } from '@/views/Request/libs'
import { updateScheme as _updateScheme } from '@/views/Request/RequestSection/helpers/update-scheme'

import OAuthScopesInput from './OAuthScopesInput.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const {
  collection,
  environment,
  envVariables,
  flow,
  persistAuth = false,
  scheme,
  server,
  workspace,
} = defineProps<{
  collection: Collection
  environment: Environment
  envVariables: EnvVariable[]
  flow: Oauth2Flow
  persistAuth: boolean
  scheme: SecuritySchemeOauth2
  server: Server | undefined
  workspace: Workspace
}>()

const loadingState = useLoadingState()
const { toast } = useToasts()
const storeContext = useWorkspace()

/** Update the current scheme */
const updateScheme: UpdateScheme = (path, value) =>
  _updateScheme(scheme.uid, path, value, storeContext, persistAuth)

/** Authorize the user using specified flow */
const handleAuthorize = async () => {
  if (loadingState.isLoading || !collection?.uid) {
    return
  }
  if (!server) {
    toast('No server selected', 'error')
    return
  }
  loadingState.startLoading()

  const [error, accessToken] = await authorizeOauth2(
    flow,
    server,
    workspace?.proxyUrl,
  ).finally(() => loadingState.stopLoading())

  if (accessToken) {
    updateScheme(`flows.${flow.type}.token`, accessToken)
  } else {
    console.error(error)
    toast(error?.message ?? 'Failed to authorize', 'error')
  }
}

/** To make prop drilling a little easier */
const dataTableInputProps = {
  environment,
  envVariables,
  workspace,
}
</script>

<template>
  <!-- Access Token Granted -->
  <template v-if="flow.token">
    <DataTableRow>
      <RequestAuthDataTableInput
        v-bind="dataTableInputProps"
        class="border-r-transparent"
        :modelValue="flow.token"
        placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
        type="password"
        @update:modelValue="(v) => updateScheme(`flows.${flow.type}.token`, v)">
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
        v-bind="dataTableInputProps"
        containerClass="border-r-0"
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
        v-bind="dataTableInputProps"
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
        v-bind="dataTableInputProps"
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
          v-bind="dataTableInputProps"
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
          v-bind="dataTableInputProps"
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
        v-bind="dataTableInputProps"
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
        v-bind="dataTableInputProps"
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
        v-bind="dataTableInputProps"
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
