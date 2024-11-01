<script setup lang="ts">
import { DataTableRow } from '@/components/DataTable'
import { type UpdateScheme, useWorkspace } from '@/store'
import RequestAuthDataTableInput from '@/views/Request/RequestSection/RequestAuthDataTableInput.vue'
import { authorizeOauth2 } from '@/views/Request/libs'
import { ScalarButton, useLoadingState } from '@scalar/components'
import type {
  SecuritySchemeOauth2,
  SecuritySchemeOauth2ExampleValue,
} from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'

import OAuthScopesInput from './OAuthScopesInput.vue'

const props = defineProps<{
  example: SecuritySchemeOauth2ExampleValue
  scheme: SecuritySchemeOauth2
}>()

const loadingState = useLoadingState()
const { toast } = useToasts()

const {
  activeCollection,
  activeServer,
  collectionMutators,
  isReadOnly,
  securitySchemeMutators,
} = useWorkspace()

type CollectionArgs = Parameters<typeof collectionMutators.edit>

/** Update the current auth */
const updateAuth = (path: CollectionArgs[1], value: CollectionArgs[2]) =>
  activeCollection.value &&
  collectionMutators.edit(activeCollection.value.uid, path, value)

/** Update the current scheme */
const updateScheme: UpdateScheme = (path, value) =>
  securitySchemeMutators.edit(props.scheme.uid, path, value)

/** Authorize the user using specified flow */
const handleAuthorize = async () => {
  if (loadingState.isLoading || !activeCollection.value?.uid) return
  loadingState.startLoading()

  const [error, accessToken] = await authorizeOauth2(
    props.scheme,
    props.example,
    activeServer.value,
  ).finally(() => loadingState.stopLoading())

  if (accessToken) updateAuth(`auth.${props.scheme.uid}.token`, accessToken)
  else {
    console.error(error)
    toast(error?.message ?? 'Failed to authorize', 'error')
  }
}
</script>

<template>
  <!-- Access Token Granted -->
  <template v-if="example.token">
    <DataTableRow>
      <RequestAuthDataTableInput
        id="oauth2-access-token"
        class="border-r-transparent"
        :modelValue="example.token"
        placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
        type="password"
        @update:modelValue="
          (v) => updateAuth(`auth.${props.scheme.uid}.token`, v)
        ">
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
          @click="updateAuth(`auth.${props.scheme.uid}.token`, '')">
          Clear
        </ScalarButton>
      </div>
    </DataTableRow>
  </template>

  <template v-else>
    <!-- Custom auth -->
    <DataTableRow v-if="!isReadOnly">
      <RequestAuthDataTableInput
        v-if="'authorizationUrl' in scheme.flow"
        :id="`oauth2-authorization-url-${scheme.uid}`"
        :modelValue="scheme.flow.authorizationUrl"
        placeholder="https://galaxy.scalar.com/authorize"
        @update:modelValue="(v) => updateScheme('flow.authorizationUrl', v)">
        Auth Url
      </RequestAuthDataTableInput>

      <RequestAuthDataTableInput
        v-if="'tokenUrl' in scheme.flow"
        :id="`oauth2-token-url-${scheme.uid}`"
        :modelValue="scheme.flow.tokenUrl"
        placeholder="https://galaxy.scalar.com/token"
        @update:modelValue="(v) => updateScheme('flow.tokenUrl', v)">
        Token Url
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow v-if="'x-scalar-redirect-uri' in scheme.flow">
      <!-- Redirect URI -->
      <RequestAuthDataTableInput
        :id="`oauth2-redirect-uri-${scheme.uid}`"
        :modelValue="scheme.flow['x-scalar-redirect-uri']"
        placeholder="https://galaxy.scalar.com/callback"
        @update:modelValue="
          (v) => updateScheme('flow.x-scalar-redirect-uri', v)
        ">
        Redirect Url
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Username and password -->
    <template v-if="example.type === 'oauth-password'">
      <DataTableRow>
        <RequestAuthDataTableInput
          :id="`oauth2-password-username-${scheme.uid}`"
          class="text-c-2"
          :modelValue="example.username"
          placeholder="ScalarEnjoyer01"
          @update:modelValue="
            (v) => updateAuth(`auth.${scheme.uid}.username`, v)
          ">
          Username
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          :id="`oauth2-password-password-${scheme.uid}`"
          :modelValue="example.password"
          placeholder="xxxxxx"
          type="password"
          @update:modelValue="
            (v) => updateAuth(`auth.${scheme.uid}.password`, v)
          ">
          Password
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- Client ID -->
    <DataTableRow>
      <RequestAuthDataTableInput
        :id="`oauth2-client-id-${scheme.uid}`"
        :modelValue="scheme['x-scalar-client-id']"
        placeholder="12345"
        @update:modelValue="(v) => updateScheme('x-scalar-client-id', v)">
        Client ID
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Client Secret (Authorization Code / Client Credentials / Password (optional)) -->
    <DataTableRow v-if="'clientSecret' in example">
      <RequestAuthDataTableInput
        :id="`oauth2-client-secret-${scheme.uid}`"
        :modelValue="example.clientSecret"
        placeholder="XYZ123"
        type="password"
        @update:modelValue="
          (v) => updateAuth(`auth.${scheme.uid}.clientSecret`, v)
        ">
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
