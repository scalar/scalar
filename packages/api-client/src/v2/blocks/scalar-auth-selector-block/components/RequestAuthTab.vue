<script setup lang="ts">
import { ScalarMarkdownSummary } from '@scalar/components'
import type {
  SecretsApiKey,
  SecretsHttp,
} from '@scalar/workspace-store/entities/auth'
import type {
  ApiReferenceEvents,
  WorkspaceEventBus,
} from '@scalar/workspace-store/events'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type {
  ApiKeyObject,
  SecurityRequirementObject,
  ServerObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { capitalize, computed, ref } from 'vue'

import type { MergedSecuritySchemes } from '@/v2/blocks/scalar-auth-selector-block'
import OAuth2 from '@/v2/blocks/scalar-auth-selector-block/components/OAuth2.vue'
import type { SecuritySchemeObjectSecret } from '@/v2/blocks/scalar-auth-selector-block/helpers/secret-types'
import { DataTableCell, DataTableRow } from '@/v2/components/data-table'

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
}>()

const emits = defineEmits<{
  (
    e: 'update:selectedScopes',
    payload: Omit<ApiReferenceEvents['auth:update:selected-scopes'], 'meta'>,
  ): void
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

/** Determines if multiple auth schemes are configured, which affects the UI layout. */
const hasMultipleSchemes = computed<boolean>(() => security.value.length > 1)

/**
 * Generates a human-readable label for the security scheme.
 * Includes the scheme name, type-specific details, and optional description.
 */
const generateLabel = (
  name: string,
  scheme: SecuritySchemeObjectSecret,
): string => {
  const capitalizedName = capitalize(name)
  const description = scheme.description ? `: ${scheme.description}` : ''

  switch (scheme.type) {
    case 'apiKey':
      return `${capitalizedName}${description || `: ${scheme.in}`}`

    case 'oauth2': {
      const firstFlow = Object.keys(scheme.flows ?? {})[0]
      const currentFlow = activeFlow.value || firstFlow
      return `${capitalizedName}: ${currentFlow}${description}`
    }

    case 'http':
      return `${capitalizedName}: ${scheme.scheme}${description}`

    default:
      return `${capitalizedName}${description || `: ${scheme.type}`}`
  }
}

/**
 * Determines if an OAuth2 flow tab should be active.
 * The first flow is active by default if no flow is explicitly selected.
 */
const isFlowActive = (flowKey: string, index: number): boolean =>
  activeFlow.value === flowKey || (index === 0 && !activeFlow.value)

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
    <!-- Header: shown when multiple auth schemes are configured -->
    <DataTableRow v-if="hasMultipleSchemes && scheme">
      <DataTableCell
        :aria-label="generateLabel(name, scheme)"
        class="text-c-2 group/auth flex items-center leading-[22px] whitespace-nowrap outline-none hover:whitespace-normal">
        <p
          class="bg-b-1 text-c-2 outline-b-3 top-0 z-1 h-full w-full overflow-hidden px-3 py-1.25 text-ellipsis group-hover/auth:absolute group-hover/auth:h-auto group-hover/auth:border-b *:first:line-clamp-1 *:first:text-ellipsis group-hover/auth:*:first:line-clamp-none">
          {{ generateLabel(name, scheme) }}
        </p>
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
      <DataTableRow>
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

    <!-- OAuth 2.0 Authentication -->
    <template v-else-if="scheme?.type === 'oauth2'">
      <!-- Flow selector tabs: shown when multiple flows are available -->
      <DataTableRow v-if="Object.keys(scheme.flows).length > 1">
        <div class="flex min-h-8 border-t text-base">
          <div class="flex h-8 max-w-full gap-2.5 overflow-x-auto px-3">
            <button
              v-for="(_, key, ind) in scheme.flows"
              :key="key"
              :class="getFlowTabClasses(key, ind)"
              type="button"
              @click="activeFlow = key">
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
          v-if="isFlowActive(key, ind)"
          :environment
          :eventBus
          :flows="scheme.flows"
          :name="name"
          :proxyUrl
          :selectedScopes="scopes"
          :server="server"
          :type="key"
          @update:selectedScopes="(event) => handleScopesUpdate(name, event)" />
      </template>
    </template>

    <!-- OpenID Connect: coming soon -->
    <template v-else-if="scheme?.type === 'openIdConnect'">
      <div
        class="text-c-3 bg-b-1 flex min-h-[calc(4rem+1px)] items-center justify-center border-t border-b-0 px-4 text-base"
        :class="{ 'rounded-b-lg': isStatic }">
        Coming soon
      </div>
    </template>
  </template>
</template>
