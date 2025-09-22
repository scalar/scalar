<script setup lang="ts">
import { ScalarMarkdownSummary } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type {
  ComponentsObject,
  OpenApiDocument,
  SecuritySchemeObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { capitalize, computed, ref } from 'vue'

import { DataTableCell, DataTableRow } from '@/components/DataTable'
import { type EnvVariable } from '@/store'
import OAuth2 from '@/v2/blocks/scalar-auth-selector-block/components/OAuth2.vue'
import type { UpdateSecuritySchemeEvent } from '@/v2/blocks/scalar-auth-selector-block/event-types'

import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const {
  environment,
  envVariables,
  layout,
  selectedSecuritySchema: selectedSecuritySchemas,
  securitySchemes,
} = defineProps<{
  environment: Environment
  envVariables: EnvVariable[]
  layout: 'client' | 'reference'
  selectedSecuritySchema: NonNullable<
    OpenApiDocument['x-scalar-selected-security']
  >[number]
  securitySchemes: NonNullable<ComponentsObject['securitySchemes']>
}>()

const emits = defineEmits<{
  (e: 'update:securityScheme', payload: UpdateSecuritySchemeEvent): void
  (
    e: 'update:selectedScopes',
    payload: { id: string[]; name: string; scopes: string[] },
  ): void
}>()

const security = computed(() =>
  Object.entries(selectedSecuritySchemas).map(([name, scopes]) => ({
    scheme: getResolvedRef(securitySchemes[name]),
    name,
    scopes,
  })),
)

const activeFlow = ref('')

const generateLabel = (name: string, scheme: SecuritySchemeObject) => {
  // ApiKeyHeader: header
  const description = scheme.description ? `: ${scheme.description}` : ''
  const baseLabel = `${capitalize(name)}${description || `: ${scheme.type}`}`

  if (scheme.type === 'apiKey') {
    return `${capitalize(name)}${description || `: ${scheme.in}`}`
  }

  // OAuth2: Authorization Code
  if (scheme.type === 'oauth2') {
    const firstFlow = Object.keys(scheme.flows ?? {})[0]

    return `${capitalize(name)}: ${
      activeFlow.value ? activeFlow.value : (firstFlow ?? '')
    }${description}`
  }

  // HTTP: Bearer
  if (scheme.type === 'http') {
    return `${capitalize(name)}: ${scheme.scheme}${description}`
  }

  // Default
  return `${baseLabel}${description}`
}

/** To make prop drilling a little easier */
const dataTableInputProps = {
  environment,
  envVariables,
}
</script>
<template>
  <!-- Loop over for multiple auth selection -->
  <template
    v-for="{ scheme, name, scopes } in security"
    :key="name">
    <!-- Header -->
    <DataTableRow v-if="security.length > 1 && scheme">
      <DataTableCell
        :aria-label="generateLabel(name, scheme)"
        class="text-c-2 group/auth flex items-center leading-[22px] whitespace-nowrap outline-none hover:whitespace-normal">
        <p
          class="bg-b-1 text-c-2 outline-b-3 top-0 z-1 h-full w-full overflow-hidden px-3 py-1.25 text-ellipsis group-hover/auth:absolute group-hover/auth:h-auto group-hover/auth:border-b *:first:line-clamp-1 *:first:text-ellipsis group-hover/auth:*:first:line-clamp-none">
          {{ generateLabel(name, scheme) }}
        </p>
      </DataTableCell>
    </DataTableRow>

    <!-- Description -->
    <DataTableRow v-if="scheme?.description && security.length <= 1">
      <DataTableCell
        :aria-label="scheme.description"
        class="max-h-[auto]">
        <ScalarMarkdownSummary
          class="auth-description bg-b-1 text-c-2 min-w-0 flex-1 px-3 py-1.25"
          :value="scheme.description" />
      </DataTableCell>
    </DataTableRow>

    <!-- HTTP -->
    <template v-if="scheme?.type === 'http'">
      <!-- Bearer -->
      <DataTableRow v-if="scheme.scheme === 'bearer'">
        <RequestAuthDataTableInput
          v-bind="dataTableInputProps"
          :containerClass="layout === 'reference' && 'border-t'"
          :modelValue="scheme['x-scalar-secret-token'] ?? ''"
          placeholder="Token"
          type="password"
          @update:modelValue="
            (v) =>
              emits('update:securityScheme', {
                type: 'http',
                payload: { token: v },
              })
          ">
          Bearer Token
        </RequestAuthDataTableInput>
      </DataTableRow>

      <!-- HTTP Basic -->
      <template v-else-if="scheme?.scheme === 'basic'">
        <DataTableRow>
          <RequestAuthDataTableInput
            v-bind="dataTableInputProps"
            class="text-c-2"
            :modelValue="scheme['x-scalar-secret-username'] ?? ''"
            placeholder="janedoe"
            required
            @update:modelValue="
              (v) =>
                emits('update:securityScheme', {
                  type: 'http',
                  payload: { username: v },
                })
            ">
            Username
          </RequestAuthDataTableInput>
        </DataTableRow>
        <DataTableRow>
          <RequestAuthDataTableInput
            v-bind="dataTableInputProps"
            :modelValue="scheme['x-scalar-secret-password'] ?? ''"
            placeholder="********"
            type="password"
            @update:modelValue="
              (v) =>
                emits('update:securityScheme', {
                  type: 'http',
                  payload: { password: v },
                })
            ">
            Password
          </RequestAuthDataTableInput>
        </DataTableRow>
      </template>
    </template>

    <!-- API Key -->
    <template v-else-if="scheme?.type === 'apiKey'">
      <DataTableRow>
        <RequestAuthDataTableInput
          v-bind="dataTableInputProps"
          :containerClass="layout === 'reference' && 'border-t'"
          :modelValue="scheme.name"
          placeholder="api-key"
          @update:modelValue="
            (v) =>
              emits('update:securityScheme', {
                type: 'apiKey',
                payload: { name: v },
              })
          ">
          Name
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          v-bind="dataTableInputProps"
          :modelValue="scheme['x-scalar-secret-token'] ?? ''"
          placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
          type="password"
          @update:modelValue="
            (v) =>
              emits('update:securityScheme', {
                type: 'apiKey',
                payload: { value: v },
              })
          ">
          Value
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- OAuth 2 -->
    <template v-else-if="scheme?.type === 'oauth2'">
      <DataTableRow>
        <div
          v-if="Object.keys(scheme.flows).length > 1"
          class="flex min-h-8 border-t text-base">
          <div class="flex h-8 max-w-full gap-2.5 overflow-x-auto px-3">
            <button
              v-for="(_, key, ind) in scheme?.flows"
              :key="key"
              class="floating-bg text-c-3 relative cursor-pointer border-b-[1px] border-transparent py-1 text-base font-medium"
              :class="{
                '!text-c-1 !rounded-none border-b-[1px] !border-current':
                  layout !== 'reference' &&
                  (activeFlow === key || (ind === 0 && !activeFlow)),
                '!text-c-1 !rounded-none border-b-[1px] !border-current opacity-100':
                  layout === 'reference' &&
                  (activeFlow === key || (ind === 0 && !activeFlow)),
              }"
              type="button"
              @click="activeFlow = key">
              <span class="relative z-10">{{ key }}</span>
            </button>
          </div>
        </div>
      </DataTableRow>
      <template
        v-for="(_flow, key, ind) in scheme.flows"
        :key="key">
        <OAuth2
          v-if="activeFlow === key || (ind === 0 && !activeFlow)"
          v-bind="dataTableInputProps"
          :flows="scheme.flows"
          proxyUrl=""
          :scheme="scheme"
          :selectedScopes="scopes"
          :server="undefined"
          :type="key"
          @update:securityScheme="
            (payload) =>
              emits('update:securityScheme', {
                type: 'oauth2',
                flow: key,
                payload: payload,
              })
          "
          @update:selectedScopes="
            emits('update:selectedScopes', {
              id: Object.keys(selectedSecuritySchema),
              name,
              ...$event,
            })
          " />
      </template>
    </template>

    <!-- Open ID Connect -->
    <template v-else-if="scheme?.type === 'openIdConnect'">
      <div
        class="text-c-3 bg-b-1 flex min-h-[calc(4rem+1px)] items-center justify-center border-t border-b-0 px-4 text-base"
        :class="{ 'rounded-b-lg': layout === 'reference' }">
        Coming soon
      </div>
    </template>
  </template>
</template>
