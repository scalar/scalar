<script setup lang="ts">
import { ScalarMarkdownSummary } from '@scalar/components/markdown'
import type {
  SecretsApiKey,
  SecretsEncryption,
  SecretsGssapi,
  SecretsHttp,
  SecretsSasl,
  SecretsX509,
} from '@scalar/workspace-store/entities/auth'
import type {
  ApiReferenceEvents,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  EncryptionObjectSecret,
  GssapiObjectSecret,
  MergedSecuritySchemes,
  SaslObjectSecret,
  SecuritySchemeObjectSecret,
  X509ObjectSecret,
} from '@scalar/workspace-store/request-example'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import { getDocumentTypeLabel } from '@scalar/workspace-store/schemas/type-guards'
import type {
  ApiKeyObject,
  SecurityRequirementObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { capitalize, computed, ref } from 'vue'

import { DataTableCell, DataTableRow } from '@/v2/components/data-table'

import OAuth2, { type OAuth2Options } from './OAuth2.vue'
import OpenIDConnect from './OpenIDConnect.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

type SecurityItem = {
  scheme: SecuritySchemeObjectSecret | undefined
  name: string
  scopes: string[]
}

const {
  environment,
  isStatic,
  proxyUrl,
  selectedSecuritySchemas,
  securitySchemes,
  server,
  eventBus,
  options,
  documentType = 'openapi',
} = defineProps<{
  /** Current environment configuration */
  environment: XScalarEnvironment
  /** Controls the display of certain borders which are used when we are non-collapsible */
  isStatic: boolean
  /** Proxy URL */
  proxyUrl: string
  /** Selected security schemes*/
  selectedSecuritySchemas: SecurityRequirementObject
  /** Merged security schemes from the document and the config together with the auth store secrets */
  securitySchemes: MergedSecuritySchemes
  /** Current server configuration */
  server: ServerObject | null
  /** Event bus for authentication updates */
  eventBus: WorkspaceEventBus
  /**  Any config options required for the OAuth2 flow */
  options?: OAuth2Options
  /** Type of the document the schemes belong to, used to label the missing-type warning */
  documentType?: 'openapi' | 'asyncapi'
}>()

/**
 * Human-readable name of the document type.
 * Used in the missing-type warning so it points at the correct document
 * (e.g. "AsyncAPI") instead of always naming OpenAPI.
 */
const documentTypeLabel = computed<string>(() =>
  getDocumentTypeLabel(documentType),
)

const emits = defineEmits<{
  (
    e: 'update:selectedScopes',
    payload: Omit<ApiReferenceEvents['auth:update:selected-scopes'], 'meta'>,
  ): void
  (e: 'upsert:scope', payload: ApiReferenceEvents['auth:upsert:scopes']): void
  (e: 'delete:scope', payload: ApiReferenceEvents['auth:delete:scopes']): void
}>()

/**
 * Resolves security schemes from the OpenAPI document and combines them with their selected scopes.
 * Each item includes the scheme definition, name, and associated scopes.
 */
const security = computed<SecurityItem[]>(() =>
  Object.entries(selectedSecuritySchemas).map(([name, scopes = []]) => ({
    scheme: getResolvedRef(securitySchemes[name]),
    name,
    scopes,
  })),
)

/** Tracks which OAuth2 flow is currently active when multiple flows are available. */
const activeFlow = ref<string>('')

/** Keeps the selected flow in sync with currently available flow keys. */
const selectedFlow = computed<string>(() => {
  const authFlowKeys = security.value.flatMap(({ scheme }) => {
    if (scheme?.type !== 'oauth2' && scheme?.type !== 'openIdConnect') {
      return []
    }

    return Object.keys(scheme.flows ?? {})
  })

  return authFlowKeys.includes(activeFlow.value) ? activeFlow.value : ''
})

const setActiveFlow = (flow: string): void => {
  activeFlow.value = flow
}

/** Determines if multiple auth schemes are configured, which affects the UI layout. */
const hasMultipleSchemes = computed<boolean>(() => security.value.length > 1)

/**
 * Generates a human-readable label for the security scheme.
 * Intentionally omits the description here — it is rendered separately as
 * rich text via ScalarMarkdownSummary so markdown formatting is preserved.
 */
const generateLabel = (
  name: string,
  scheme: SecuritySchemeObjectSecret,
): string => {
  const capitalizedName = capitalize(name)

  switch (scheme.type) {
    case 'apiKey':
      return `${capitalizedName}: ${scheme.in}`

    case 'openIdConnect':
    case 'oauth2': {
      const firstFlow = Object.keys(scheme.flows ?? {})[0]
      const currentFlow = selectedFlow.value || firstFlow
      if (!currentFlow) {
        return capitalizedName
      }
      return `${capitalizedName}: ${currentFlow}`
    }

    case 'http':
      return `${capitalizedName}: ${scheme.scheme}`

    default:
      return capitalizedName
  }
}

/**
 * Whether an API key scheme exposes an editable parameter name.
 *
 * OpenAPI `apiKey` and AsyncAPI `httpApiKey` (normalized to `apiKey`) name a query/header/cookie
 * parameter, so the Name input is shown. AsyncAPI `apiKey` places the key in the broker `user` or
 * `password` slot and has no parameter name, so the Name input is hidden and only the value is asked for.
 */
const apiKeyHasName = (scheme: { in?: string }): boolean =>
  scheme.in !== 'user' && scheme.in !== 'password'

const SASL_SCHEME_TYPES = [
  'userPassword',
  'plain',
  'scramSha256',
  'scramSha512',
] as const

/**
 * SASL-style AsyncAPI broker schemes (`userPassword`, `plain`, `scramSha256`, `scramSha512`):
 * they all authenticate with a username + password pair, so they share one form.
 */
const isSaslScheme = (
  scheme: SecurityItem['scheme'],
): scheme is SaslObjectSecret =>
  Boolean(scheme) &&
  (SASL_SCHEME_TYPES as readonly string[]).includes(scheme!.type)

const ENCRYPTION_SCHEME_TYPES = [
  'symmetricEncryption',
  'asymmetricEncryption',
] as const

/** AsyncAPI encryption broker schemes: a single key value. */
const isEncryptionScheme = (
  scheme: SecurityItem['scheme'],
): scheme is EncryptionObjectSecret =>
  Boolean(scheme) &&
  (ENCRYPTION_SCHEME_TYPES as readonly string[]).includes(scheme!.type)

/** AsyncAPI X509 broker scheme: a client certificate + private key pair (PEM). */
const isX509Scheme = (
  scheme: SecurityItem['scheme'],
): scheme is X509ObjectSecret => scheme?.type === 'X509'

/** AsyncAPI GSSAPI (Kerberos) broker scheme: the service name the client authenticates against. */
const isGssapiScheme = (
  scheme: SecurityItem['scheme'],
): scheme is GssapiObjectSecret => scheme?.type === 'gssapi'

/**
 * The scheme's type when it is one we do not render inputs for (a type outside both the OpenAPI
 * and AsyncAPI security scheme unions). Read through a helper so the fallback template branch,
 * where the scheme type is narrowed to `never` after the supported cases, can still surface the type.
 */
const getUnsupportedSchemeType = (
  scheme: SecurityItem['scheme'],
): string | undefined => scheme?.type

/**
 * Determines if an OAuth2 flow tab should be active.
 * The first flow is active by default if no flow is explicitly selected.
 */
const isFlowActive = (flowKey: string, index: number): boolean =>
  selectedFlow.value === flowKey || (index === 0 && !selectedFlow.value)

/** Computes the container class for static display mode. */
const getStaticBorderClass = (): string | false => isStatic && 'border-t'

const handleHttpSecretsUpdate = (
  payload: Omit<Partial<SecretsHttp>, 'type'>,
  name: string,
): void =>
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: { type: 'http', ...payload },
    name,
  })

const handleApiKeySecretsUpdate = (
  payload: Omit<Partial<SecretsApiKey>, 'type'>,
  name: string,
): void =>
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: { type: 'apiKey', ...payload },
    name,
  })

const handleSaslSecretsUpdate = (
  payload: Omit<Partial<SecretsSasl>, 'type'>,
  name: string,
  type: SecretsSasl['type'],
): void =>
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: { type, ...payload },
    name,
  })

const handleX509SecretsUpdate = (
  payload: Omit<Partial<SecretsX509>, 'type'>,
  name: string,
): void =>
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: { type: 'X509', ...payload },
    name,
  })

const handleEncryptionSecretsUpdate = (
  payload: Omit<Partial<SecretsEncryption>, 'type'>,
  name: string,
  type: SecretsEncryption['type'],
): void =>
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: { type, ...payload },
    name,
  })

const handleGssapiSecretsUpdate = (
  payload: Omit<Partial<SecretsGssapi>, 'type'>,
  name: string,
): void =>
  eventBus.emit('auth:update:security-scheme-secrets', {
    payload: { type: 'gssapi', ...payload },
    name,
  })

const handleApiKeySecuritySchemeUpdate = (
  payload: Omit<Partial<ApiKeyObject>, 'type'>,
  name: string,
): void =>
  eventBus.emit('auth:update:security-scheme', {
    payload: { type: 'apiKey', ...payload },
    name,
  })

/** Handles scope selection updates for OAuth2 */
const handleScopesUpdate = (
  name: string,
  event: { scopes: string[] },
): void => {
  emits('update:selectedScopes', {
    id: Object.keys(selectedSecuritySchemas),
    name,
    ...event,
  })
}

/** Handles scope-definition upserts (add / rename / description change) */
const handleScopeUpsert = (
  name: string,
  event: Omit<ApiReferenceEvents['auth:upsert:scopes'], 'name'>,
): void => {
  emits('upsert:scope', { ...event, name })
}

/** Handles scope-definition deletes */
const handleScopeDelete = (
  name: string,
  event: Omit<ApiReferenceEvents['auth:delete:scopes'], 'name'>,
): void => {
  emits('delete:scope', { ...event, name })
}

/**
 * Computes dynamic classes for OAuth2 flow tabs based on active state.
 */
const getFlowTabClasses = (flowKey: string, index: number): string => {
  const baseClasses =
    'floating-bg text-c-3 relative cursor-pointer border-b border-transparent py-1 text-base font-medium'
  const activeClasses = '!text-c-1 !rounded-none border-b !border-current'

  return isFlowActive(flowKey, index)
    ? `${baseClasses} ${activeClasses} ${isStatic ? 'opacity-100' : ''}`
    : baseClasses
}
</script>
<template>
  <template
    v-for="{ scheme, name, scopes } in security"
    :key="name">
    <!--
      Header row for AND'ed schemes: label (bold) and description (rich text) are
      combined.
    -->
    <DataTableRow v-if="hasMultipleSchemes && scheme">
      <DataTableCell
        :aria-label="generateLabel(name, scheme)"
        class="max-h-[auto]">
        <div class="bg-b-1 min-w-0 flex-1 px-3 py-1.25">
          <p class="text-c-1 leading-5.5 font-medium">
            {{ generateLabel(name, scheme) }}
          </p>
          <ScalarMarkdownSummary
            v-if="scheme.description"
            class="auth-description text-c-2 w-full"
            :value="scheme.description" />
        </div>
      </DataTableCell>
    </DataTableRow>

    <!-- Description: shown for single auth schemes with descriptions -->
    <DataTableRow v-if="scheme?.description && !hasMultipleSchemes">
      <DataTableCell
        :aria-label="scheme.description"
        class="max-h-[auto]">
        <ScalarMarkdownSummary
          class="auth-description bg-b-1 text-c-2 min-w-0 flex-1 px-3 py-1.25"
          :value="scheme.description" />
      </DataTableCell>
    </DataTableRow>

    <!-- HTTP Authentication -->
    <template v-if="scheme?.type === 'http'">
      <!-- Bearer Token -->
      <DataTableRow v-if="scheme.scheme === 'bearer'">
        <RequestAuthDataTableInput
          :containerClass="getStaticBorderClass()"
          :environment
          :modelValue="scheme['x-scalar-secret-token']"
          placeholder="Token"
          type="password"
          @update:modelValue="
            (v) => handleHttpSecretsUpdate({ 'x-scalar-secret-token': v }, name)
          ">
          Bearer Token
        </RequestAuthDataTableInput>
      </DataTableRow>

      <!-- HTTP Basic Authentication -->
      <template v-else-if="scheme?.scheme === 'basic'">
        <DataTableRow>
          <RequestAuthDataTableInput
            class="text-c-2"
            :environment
            :modelValue="scheme['x-scalar-secret-username']"
            placeholder="janedoe"
            required
            @update:modelValue="
              (v) =>
                handleHttpSecretsUpdate({ 'x-scalar-secret-username': v }, name)
            ">
            Username
          </RequestAuthDataTableInput>
        </DataTableRow>
        <DataTableRow>
          <RequestAuthDataTableInput
            :environment
            :modelValue="scheme['x-scalar-secret-password']"
            placeholder="********"
            type="password"
            @update:modelValue="
              (v) =>
                handleHttpSecretsUpdate({ 'x-scalar-secret-password': v }, name)
            ">
            Password
          </RequestAuthDataTableInput>
        </DataTableRow>
      </template>
    </template>

    <!-- API Key Authentication -->
    <template v-else-if="scheme?.type === 'apiKey'">
      <DataTableRow v-if="apiKeyHasName(scheme)">
        <RequestAuthDataTableInput
          :containerClass="getStaticBorderClass()"
          :environment
          :modelValue="scheme.name"
          placeholder="api-key"
          @update:modelValue="
            (v) => handleApiKeySecuritySchemeUpdate({ name: v }, name)
          ">
          Name
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          :containerClass="
            apiKeyHasName(scheme) ? undefined : getStaticBorderClass()
          "
          :environment
          :modelValue="scheme['x-scalar-secret-token']"
          placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
          type="password"
          @update:modelValue="
            (v) =>
              handleApiKeySecretsUpdate({ 'x-scalar-secret-token': v }, name)
          ">
          Value
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- OAuth 2.0  / OpenID Connect Authentication -->
    <template
      v-else-if="scheme?.type === 'oauth2' || scheme?.type === 'openIdConnect'">
      <!-- OpenID Connect -->
      <OpenIDConnect
        v-if="
          scheme?.type === 'openIdConnect' &&
          !Object.keys(scheme.flows ?? {}).length
        "
        :customFetch="options?.customFetch"
        :environment
        :eventBus
        :getStaticBorderClass
        :name
        :proxyUrl
        :scheme />

      <!-- Flow selector tabs: shown when multiple flows are available -->
      <DataTableRow v-if="Object.keys(scheme.flows ?? {}).length > 1">
        <div class="flex min-h-8 border-t text-base">
          <div class="flex h-8 max-w-full gap-2.5 overflow-x-auto px-3">
            <button
              v-for="(_, key, ind) in scheme.flows"
              :key="key"
              :class="getFlowTabClasses(key, ind)"
              type="button"
              @click="setActiveFlow(key)">
              <span class="relative z-10">{{ key }}</span>
            </button>
          </div>
        </div>
      </DataTableRow>

      <!-- OAuth2 flow configuration -->
      <template
        v-for="(_flow, key, ind) in scheme.flows"
        :key="key">
        <OAuth2
          v-if="scheme.flows && isFlowActive(key, ind)"
          :environment
          :eventBus
          :flows="scheme.flows"
          :name
          :options
          :proxyUrl
          :scheme
          :selectedScopes="scopes"
          :server
          :type="key"
          @delete:scope="(event) => handleScopeDelete(name, event)"
          @update:selectedScopes="(event) => handleScopesUpdate(name, event)"
          @upsert:scope="(event) => handleScopeUpsert(name, event)" />
      </template>
    </template>

    <!-- SASL broker authentication (userPassword, plain, scramSha256, scramSha512) -->
    <template v-else-if="isSaslScheme(scheme)">
      <DataTableRow>
        <RequestAuthDataTableInput
          class="text-c-2"
          :containerClass="getStaticBorderClass()"
          :environment
          :modelValue="scheme['x-scalar-secret-username']"
          placeholder="janedoe"
          required
          @update:modelValue="
            (v) =>
              handleSaslSecretsUpdate(
                { 'x-scalar-secret-username': v },
                name,
                scheme.type,
              )
          ">
          Username
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          :environment
          :modelValue="scheme['x-scalar-secret-password']"
          placeholder="********"
          type="password"
          @update:modelValue="
            (v) =>
              handleSaslSecretsUpdate(
                { 'x-scalar-secret-password': v },
                name,
                scheme.type,
              )
          ">
          Password
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- X509 client certificate authentication -->
    <template v-else-if="isX509Scheme(scheme)">
      <DataTableRow>
        <RequestAuthDataTableInput
          :containerClass="getStaticBorderClass()"
          :environment
          :modelValue="scheme['x-scalar-secret-client-certificate']"
          placeholder="-----BEGIN CERTIFICATE-----"
          type="password"
          @update:modelValue="
            (v) =>
              handleX509SecretsUpdate(
                { 'x-scalar-secret-client-certificate': v },
                name,
              )
          ">
          Client Certificate
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          :environment
          :modelValue="scheme['x-scalar-secret-private-key']"
          placeholder="-----BEGIN PRIVATE KEY-----"
          type="password"
          @update:modelValue="
            (v) =>
              handleX509SecretsUpdate(
                { 'x-scalar-secret-private-key': v },
                name,
              )
          ">
          Private Key
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- Symmetric / asymmetric encryption key -->
    <template v-else-if="isEncryptionScheme(scheme)">
      <DataTableRow>
        <RequestAuthDataTableInput
          :containerClass="getStaticBorderClass()"
          :environment
          :modelValue="scheme['x-scalar-secret-token']"
          placeholder="********"
          type="password"
          @update:modelValue="
            (v) =>
              handleEncryptionSecretsUpdate(
                { 'x-scalar-secret-token': v },
                name,
                scheme.type,
              )
          ">
          Key
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- GSSAPI (Kerberos) authentication -->
    <template v-else-if="isGssapiScheme(scheme)">
      <DataTableRow>
        <RequestAuthDataTableInput
          :containerClass="getStaticBorderClass()"
          :environment
          :modelValue="scheme['x-scalar-secret-service-name']"
          placeholder="kafka"
          @update:modelValue="
            (v) =>
              handleGssapiSecretsUpdate(
                { 'x-scalar-secret-service-name': v },
                name,
              )
          ">
          Service Name
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- Scheme has a type we do not render inputs for -->
    <div
      v-else-if="getUnsupportedSchemeType(scheme)"
      class="text-c-3 flex items-center justify-center border-t p-4 px-4 text-center text-xs text-balance">
      The <code>{{ getUnsupportedSchemeType(scheme) }}</code> security scheme
      type is not supported yet.
    </div>

    <!-- Scheme is missing type -->
    <div
      v-else
      class="text-c-3 flex items-center justify-center border-t p-4 px-4 text-center text-xs text-balance">
      The security scheme is missing a type, please double check your
      {{ documentTypeLabel }} document or Authentication Configuration
    </div>
  </template>
</template>
