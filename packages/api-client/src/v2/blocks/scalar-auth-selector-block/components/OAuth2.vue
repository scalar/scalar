<script setup lang="ts">
import { ScalarButton, useLoadingState } from '@scalar/components'
import { pkceOptions } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import type { SecretsOAuthFlows } from '@scalar/workspace-store/entities/auth'
import type {
  ApiReferenceEvents,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { XScalarCredentialsLocation } from '@scalar/workspace-store/schemas/extensions/security/x-scalar-credentials-location'
import type { XusePkce } from '@scalar/workspace-store/schemas/extensions/security/x-use-pkce'
import type {
  OAuthFlow,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { computed, watch } from 'vue'

import { DataTableRow } from '@/components/DataTable'
import OAuthScopesInput from '@/v2/blocks/scalar-auth-selector-block/components/OAuthScopesInput.vue'
import { authorizeOauth2 } from '@/v2/blocks/scalar-auth-selector-block/helpers/oauth'
import type {
  OAuthFlowAuthorizationCodeSecret,
  OAuthFlowClientCredentialsSecret,
  OAuthFlowPasswordSecret,
  OAuthFlowsObjectSecret,
} from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'

import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const {
  environment,
  flows,
  type,
  selectedScopes: selectedScopesProp,
  server,
  proxyUrl,
  eventBus,
  name,
} = defineProps<{
  /** Current environment configuration */
  environment: XScalarEnvironment
  /** OAuth flows */
  flows: OAuthFlowsObjectSecret
  /** Current environment configuration */
  /** Type of the OAuth flow */
  type: keyof OAuthFlowsObjectSecret
  /** Selected scopes */
  selectedScopes: string[]
  /** Current server configuration */
  server: ServerObject | null
  /** Proxy URL */
  proxyUrl: string
  /** Name of the security scheme */
  name: string
  /** Event bus for authentication updates */
  eventBus: WorkspaceEventBus
}>()

const emits = defineEmits<{
  (
    e: 'update:selectedScopes',
    payload: Pick<
      ApiReferenceEvents['auth:update:selected-scopes'],
      'scopes' | 'newScopePayload'
    >,
  ): void
}>()

const loader = useLoadingState()
const { toast } = useToasts()

/** The current OAuth flow based on the selected type */
const flow = computed(() => flows[type]!)
type NonImplicitFlow =
  | OAuthFlowPasswordSecret
  | OAuthFlowClientCredentialsSecret
  | OAuthFlowAuthorizationCodeSecret

/** We filter selected scopes to only include scopes that are in this flow*/
const selectedScopes = computed(() =>
  selectedScopesProp.filter((scope) => scope in (flow.value.scopes ?? {})),
)

const handleOauth2Update = (
  payload: Partial<OAuthFlow & XScalarCredentialsLocation>,
): void =>
  eventBus.emit('auth:update:security-scheme', {
    payload: {
      type: 'oauth2',
      flows: {
        [type]: payload,
      },
    },
    name,
  })

/** Updates the flow  */
const handleOauth2SecretsUpdate = (
  payload: Omit<Partial<SecretsOAuthFlows[keyof SecretsOAuthFlows]>, 'type'>,
): void =>
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: {
      type: 'oauth2',
      [type]: payload,
    },
    name,
  })

/** Default the redirect-uri to the current origin if we have access to window */
watch(
  () =>
    (flow.value as OAuthFlowAuthorizationCodeSecret)[
      'x-scalar-secret-redirect-uri'
    ],
  (newRedirectUri) => {
    if (
      newRedirectUri ||
      typeof window === 'undefined' ||
      !('x-scalar-secret-redirect-uri' in flow.value)
    ) {
      return
    }
    handleOauth2SecretsUpdate({
      'x-scalar-secret-redirect-uri':
        window.location.origin + window.location.pathname,
    })
  },
  { immediate: true },
)

/**
 * Authorizes the user using the specified OAuth flow.
 * Opens the appropriate OAuth dialog and/or performs the token exchange.
 */
const handleAuthorize = async (): Promise<void> => {
  if (loader.isLoading) {
    return
  }

  loader.start()

  const [error, accessToken] = await authorizeOauth2(
    flows,
    type,
    selectedScopes.value,
    server,
    proxyUrl,
  )

  await loader.clear()

  if (accessToken) {
    handleOauth2SecretsUpdate({ 'x-scalar-secret-token': accessToken })
  } else {
    console.error(error)
    toast(error?.message ?? 'Failed to authorize', 'error')
  }
}

/** Updates the secret location */
const handleSecretLocationUpdate = (value: string): void =>
  handleOauth2Update({
    'x-scalar-credentials-location': value === 'body' ? 'body' : 'header',
  })
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
        @update:modelValue="
          (v) => handleOauth2SecretsUpdate({ 'x-scalar-secret-token': v })
        ">
        Access Token
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow class="min-w-full">
      <div class="flex h-8 items-center justify-end gap-2 border-t">
        <ScalarButton
          class="mr-1 p-0 px-2 py-0.5"
          :loader
          size="sm"
          variant="outlined"
          @click="
            () => handleOauth2SecretsUpdate({ 'x-scalar-secret-token': '' })
          ">
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
        @update:modelValue="(v) => handleOauth2Update({ authorizationUrl: v })">
        Auth URL
      </RequestAuthDataTableInput>

      <RequestAuthDataTableInput
        v-if="'tokenUrl' in flow"
        :environment
        :modelValue="flow.tokenUrl"
        placeholder="https://galaxy.scalar.com/token"
        @update:modelValue="(v) => handleOauth2Update({ tokenUrl: v })">
        Token URL
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow v-if="'x-scalar-secret-redirect-uri' in flow">
      <RequestAuthDataTableInput
        :environment
        :modelValue="flow['x-scalar-secret-redirect-uri']"
        placeholder="https://galaxy.scalar.com/callback"
        @update:modelValue="
          (v) =>
            handleOauth2SecretsUpdate({ 'x-scalar-secret-redirect-uri': v })
        ">
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
          @update:modelValue="
            (v) => handleOauth2SecretsUpdate({ 'x-scalar-secret-username': v })
          ">
          Username
        </RequestAuthDataTableInput>
      </DataTableRow>

      <DataTableRow>
        <RequestAuthDataTableInput
          :environment
          :modelValue="flow['x-scalar-secret-password']"
          placeholder="********"
          type="password"
          @update:modelValue="
            (v) => handleOauth2SecretsUpdate({ 'x-scalar-secret-password': v })
          ">
          Password
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <DataTableRow>
      <RequestAuthDataTableInput
        :environment
        :modelValue="flow['x-scalar-secret-client-id']"
        placeholder="12345"
        @update:modelValue="
          (v) => handleOauth2SecretsUpdate({ 'x-scalar-secret-client-id': v })
        ">
        Client ID
      </RequestAuthDataTableInput>
    </DataTableRow>

    <DataTableRow v-if="'x-scalar-secret-client-secret' in flow">
      <RequestAuthDataTableInput
        :environment
        :modelValue="flow['x-scalar-secret-client-secret']"
        placeholder="XYZ123"
        type="password"
        @update:modelValue="
          (v) =>
            handleOauth2SecretsUpdate({ 'x-scalar-secret-client-secret': v })
        ">
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
            handleOauth2Update({
              'x-usePkce': v as XusePkce['x-usePkce'],
            })
        ">
        Use PKCE
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Credentials Location -->
    <DataTableRow v-if="type !== 'implicit'">
      <RequestAuthDataTableInput
        :enum="['header', 'body']"
        :environment
        :modelValue="
          (flow as NonImplicitFlow)['x-scalar-credentials-location'] || 'header'
        "
        placeholder="header"
        readOnly
        @update:modelValue="(v) => handleSecretLocationUpdate(v)">
        Credentials Location
      </RequestAuthDataTableInput>
    </DataTableRow>

    <!-- Scopes -->
    <DataTableRow>
      <OAuthScopesInput
        :flow
        :flowType="type"
        :selectedScopes
        @update:selectedScopes="(v) => emits('update:selectedScopes', v)" />
    </DataTableRow>

    <DataTableRow class="min-w-full">
      <div class="flex h-8 w-full items-center justify-end border-t">
        <ScalarButton
          class="mr-0.75 p-0 px-2 py-0.5"
          :loader
          size="sm"
          variant="outlined"
          @click="handleAuthorize">
          Authorize
        </ScalarButton>
      </div>
    </DataTableRow>
  </template>
</template>
