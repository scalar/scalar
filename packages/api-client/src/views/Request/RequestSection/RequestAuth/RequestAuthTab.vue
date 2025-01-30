<script setup lang="ts">
import { DataTableCell, DataTableRow } from '@/components/DataTable'
import { useWorkspace } from '@/store/store'
import type { Workspace } from '@scalar/oas-utils/entities'
import type {
  Collection,
  SecurityScheme,
  Server,
} from '@scalar/oas-utils/entities/spec'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import { capitalize, computed, ref } from 'vue'

import OAuth2 from './OAuth2.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const { collection, layout, securitySchemeUids, server, workspace } =
  defineProps<{
    collection: Collection
    layout: 'client' | 'reference'
    securitySchemeUids: string[]
    server: Server | undefined
    workspace: Workspace
  }>()

const { securitySchemes, securitySchemeMutators } = useWorkspace()

const security = computed(() =>
  securitySchemeUids.map((uid) => ({
    scheme: securitySchemes[uid],
  })),
)

const activeFlow = ref('')

const generateLabel = (scheme: SecurityScheme) => {
  // ApiKeyHeader: header
  if (scheme.type === 'apiKey') {
    return `${capitalize(scheme.nameKey)}: ${scheme.in}`
  }

  // OAuth2: Authorization Code
  if (scheme.type === 'oauth2') {
    const firstFlow = Object.values(scheme.flows ?? {})[0]

    return `${capitalize(scheme.nameKey)}: ${
      activeFlow.value ? activeFlow.value : (firstFlow?.type ?? '')
    }`
  }

  // HTTP: Bearer
  if (scheme.type === 'http') {
    return `${capitalize(scheme.nameKey)}: ${scheme.scheme}`
  }

  // Default
  return `${capitalize(scheme.nameKey)}: ${scheme.type}`
}

/** Update the scheme */
const updateScheme = <U extends string, P extends Path<SecurityScheme>>(
  uid: U,
  path: P,
  value: NonNullable<PathValue<SecurityScheme, P>>,
) => securitySchemeMutators.edit(uid, path, value)
</script>
<template>
  <!-- Loop over for multiple auth selection -->
  <template
    v-for="({ scheme }, index) in security"
    :key="scheme?.uid">
    <!-- Header -->
    <DataTableRow
      v-if="security.length > 1"
      :class="{
        'request-example-references-header': layout === 'reference',
      }">
      <DataTableCell
        class="text-c-3 pl-2 font-medium flex items-center"
        :class="
          layout === 'reference' && `border-t ${index !== 0 ? 'mt-2' : ''}`
        ">
        {{ generateLabel(scheme!) }}
      </DataTableCell>
    </DataTableRow>

    <!-- HTTP -->
    <template v-if="scheme?.type === 'http'">
      <!-- Bearer -->
      <DataTableRow v-if="scheme.scheme === 'bearer'">
        <RequestAuthDataTableInput
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
            class="text-c-2"
            :containerClass="
              layout === 'reference' && 'auth-blend-required border-t'
            "
            :modelValue="scheme.username"
            placeholder="janedoe"
            required
            @update:modelValue="(v) => updateScheme(scheme.uid, 'username', v)">
            Username
          </RequestAuthDataTableInput>
        </DataTableRow>
        <DataTableRow>
          <RequestAuthDataTableInput
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
          :containerClass="layout === 'reference' && 'border-t'"
          :modelValue="scheme.name"
          placeholder="api-key"
          @update:modelValue="(v) => updateScheme(scheme.uid, 'name', v)">
          Name
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          :modelValue="scheme.value"
          placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
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
          class="border-t min-h-8 flex text-sm">
          <div class="flex h-8 gap-2.5 px-3 max-w-full overflow-x-auto">
            <button
              v-for="(_, key, ind) in scheme?.flows"
              :key="key"
              class="floating-bg py-1 text-sm border-b-[1px] border-transparent relative cursor-pointer font-medium text-c-3"
              :class="{
                '!text-c-1 !border-current border-b-[1px] !rounded-none':
                  layout !== 'reference' &&
                  (activeFlow === key || (ind === 0 && !activeFlow)),
                '!text-c-1 !border-current border-b-[1px] !rounded-none opacity-100':
                  layout === 'reference' &&
                  (activeFlow === key || (ind === 0 && !activeFlow)),
              }"
              type="button"
              @click="activeFlow = key">
              <span class="z-10 relative">{{ key }}</span>
            </button>
          </div>
        </div>
      </DataTableRow>
      <template
        v-for="(flow, key, ind) in scheme?.flows"
        :key="key">
        <OAuth2
          v-if="activeFlow === key || (ind === 0 && !activeFlow)"
          :collection="collection"
          :flow="flow!"
          :scheme="scheme"
          :server="server"
          :workspace="workspace" />
      </template>
    </template>

    <!-- Open ID Connect -->
    <template v-else-if="scheme?.type === 'openIdConnect'">
      <div
        class="border-t text-c-3 px-4 text-sm min-h-16 justify-center flex items-center bg-b-1">
        Coming soon
      </div>
    </template>
  </template>
</template>

<style scoped>
.auth-blend-required :deep(.scalar-input-required),
.auth-blend-required :deep(.required) {
  background: var(--scalar-background-2);
  --tw-bg-base: var(--scalar-background-2);
  --tw-shadow: -8px 0 4px var(--scalar-background-2);
}

.request-example-references-header :deep(+ tr > td) {
  border-top: 0;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
</style>
