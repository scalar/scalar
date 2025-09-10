<script setup lang="ts">
import { ScalarMarkdownSummary } from '@scalar/components'
import type { Environment } from '@scalar/oas-utils/entities/environment'
import type {
  Collection,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Workspace } from '@scalar/oas-utils/entities/workspace'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import { capitalize, computed, onMounted, ref } from 'vue'

import { DataTableCell, DataTableRow } from '@/components/DataTable'
import type { EnvVariable } from '@/store/active-entities'
import { useWorkspace } from '@/store/store'
import { updateScheme as _updateScheme } from '@/views/Request/RequestSection/helpers/update-scheme'
import { restoreAuthFromLocalStorage } from '@/views/Request/RequestSection/RequestAuth/helpers/restore-auth-from-local-storage'

import OAuth2 from './OAuth2.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const {
  collection,
  environment,
  envVariables,
  layout,
  persistAuth = false,
  securitySchemeUids,
  server,
  workspace,
} = defineProps<{
  collection: Collection
  environment: Environment
  envVariables: EnvVariable[]
  layout: 'client' | 'reference'
  persistAuth: boolean
  securitySchemeUids: string[]
  server: Server | undefined
  workspace: Workspace
}>()

const emits = defineEmits<{
  authorized: []
}>()

defineSlots<{
  'oauth-actions'?: () => unknown
}>()

const storeContext = useWorkspace()
const { securitySchemes } = storeContext
const security = computed(() =>
  securitySchemeUids.map((uid) => ({
    scheme: securitySchemes[uid],
  })),
)

const activeFlow = ref('')

const generateLabel = (scheme: SecurityScheme) => {
  // ApiKeyHeader: header
  const description = scheme.description ? `: ${scheme.description}` : ''
  const baseLabel = `${capitalize(scheme.nameKey)}${description || `: ${scheme.type}`}`

  if (scheme.type === 'apiKey') {
    return `${capitalize(scheme.nameKey)}${description || `: ${scheme.in}`}`
  }

  // OAuth2: Authorization Code
  if (scheme.type === 'oauth2') {
    const firstFlow = Object.values(scheme.flows ?? {})[0]

    return `${capitalize(scheme.nameKey)}: ${
      activeFlow.value ? activeFlow.value : (firstFlow?.type ?? '')
    }${description}`
  }

  // HTTP: Bearer
  if (scheme.type === 'http') {
    return `${capitalize(scheme.nameKey)}: ${scheme.scheme}${description}`
  }

  // Default
  return `${baseLabel}${description}`
}

/** Wrapper for the updateScheme function */
const updateScheme = <
  U extends SecurityScheme['uid'],
  P extends Path<SecurityScheme>,
>(
  uid: U,
  path: P,
  value: NonNullable<PathValue<SecurityScheme, P>>,
) => {
  _updateScheme(uid, path, value, storeContext, persistAuth)
}

// Restore auth from local storage on mount
onMounted(() => {
  if (!persistAuth) {
    return
  }

  restoreAuthFromLocalStorage(storeContext, collection.uid)
})

/** To make prop drilling a little easier */
const dataTableInputProps = {
  environment,
  envVariables,
  workspace,
}
</script>
<template>
  <!-- Loop over for multiple auth selection -->
  <template
    v-for="{ scheme } in security"
    :key="scheme?.uid">
    <!-- Header -->
    <DataTableRow v-if="security.length > 1 && scheme">
      <DataTableCell
        :aria-label="generateLabel(scheme)"
        class="text-c-2 group/auth flex items-center leading-[22px] whitespace-nowrap outline-none hover:whitespace-normal">
        <p
          class="bg-b-1 text-c-2 outline-b-3 top-0 z-1 h-full w-full overflow-hidden px-3 py-1.25 text-ellipsis group-hover/auth:absolute group-hover/auth:h-auto group-hover/auth:border-b *:first:line-clamp-1 *:first:text-ellipsis group-hover/auth:*:first:line-clamp-none">
          {{ generateLabel(scheme) }}
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
          :modelValue="scheme.token"
          placeholder="Token"
          type="password"
          @update:modelValue="(v) => updateScheme(scheme.uid, 'token', v)">
          Bearer Token
        </RequestAuthDataTableInput>
      </DataTableRow>

      <!-- HTTP Basic -->
      <template v-else-if="scheme?.scheme === 'basic'">
        <DataTableRow>
          <RequestAuthDataTableInput
            v-bind="dataTableInputProps"
            class="text-c-2"
            :modelValue="scheme.username"
            placeholder="janedoe"
            required
            @update:modelValue="(v) => updateScheme(scheme.uid, 'username', v)">
            Username
          </RequestAuthDataTableInput>
        </DataTableRow>
        <DataTableRow>
          <RequestAuthDataTableInput
            v-bind="dataTableInputProps"
            :modelValue="scheme.password"
            placeholder="********"
            type="password"
            @update:modelValue="(v) => updateScheme(scheme.uid, 'password', v)">
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
          @update:modelValue="(v) => updateScheme(scheme.uid, 'name', v)">
          Name
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          v-bind="dataTableInputProps"
          :modelValue="scheme.value"
          placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
          type="password"
          @update:modelValue="(v) => updateScheme(scheme.uid, 'value', v)">
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
        v-for="(flow, key, ind) in scheme?.flows"
        :key="key">
        <OAuth2
          v-if="activeFlow === key || (ind === 0 && !activeFlow)"
          v-bind="dataTableInputProps"
          :collection="collection"
          :flow="flow!"
          :persistAuth="persistAuth"
          :scheme="scheme"
          :server="server"
          :workspace="workspace"
          @authorized="emits('authorized')">
          <template #oauth-actions>
            <slot name="oauth-actions" />
          </template>
        </OAuth2>
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
