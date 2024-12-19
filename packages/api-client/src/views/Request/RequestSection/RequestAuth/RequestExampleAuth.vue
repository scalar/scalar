<script setup lang="ts">
import { DataTableCell, DataTableRow } from '@/components/DataTable'
import { useWorkspace } from '@/store'
import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import { capitalize, computed, ref } from 'vue'

import OAuth2 from './OAuth2.vue'
import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const { selectedSecuritySchemeUids, layout = 'client' } = defineProps<{
  selectedSecuritySchemeUids: string[]
  layout?: 'client' | 'reference'
}>()

const { securitySchemes, securitySchemeMutators } = useWorkspace()

const security = computed(() =>
  selectedSecuritySchemeUids.map((uid) => ({
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

/**
 * A hacky way to override the styling on the references side,
 * not ideal but doesn't touch the original styling
 */
const getReferenceClass = (className = '') =>
  layout === 'reference'
    ? `bg-b-2 border-l-1/2 last:border-r-1/2 group-last:border-b-border ${className}`
    : ''
</script>
<template>
  <!-- Loop over for multiple auth selection -->
  <template
    v-for="({ scheme }, index) in security"
    :key="scheme?.uid">
    <!-- Header -->
    <DataTableRow
      v-if="security.length > 1"
      :class="{ 'request-example-references-header': layout === 'reference' }">
      <DataTableCell
        class="text-c-3 pl-2 font-medium flex items-center"
        :class="
          getReferenceClass(
            `bg-b-1 rounded-t border-t-1/2 ${index !== 0 ? 'mt-2' : ''}`,
          )
        ">
        {{ generateLabel(scheme!) }}
      </DataTableCell>
    </DataTableRow>

    <!-- HTTP -->
    <template v-if="scheme?.type === 'http'">
      <!-- Bearer -->
      <DataTableRow v-if="scheme.scheme === 'bearer'">
        <RequestAuthDataTableInput
          :containerClass="getReferenceClass('bg-b-2 rounded border-1/2')"
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
              getReferenceClass(
                'auth-blend-required bg-b-2 rounded-t border-t-1/2',
              )
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
            :containerClass="getReferenceClass('bg-b-2 rounded-b border-b-1/2')"
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
          :containerClass="getReferenceClass('bg-b-2 rounded-t border-t-1/2')"
          :modelValue="scheme.name"
          placeholder="api-key"
          @update:modelValue="(v) => updateScheme(scheme.uid, 'name', v)">
          Name
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          :containerClass="getReferenceClass('bg-b-2 rounded-b border-b-1/2')"
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
          class="min-h-8 flex text-sm"
          :class="{
            'border-1/2 border-b-0 rounded-t bg-b-2': layout === 'reference',
          }">
          <div class="flex h-8 gap-2.5 px-3 max-w-full overflow-x-auto">
            <button
              v-for="(_, key, ind) in scheme?.flows"
              :key="key"
              class="py-1 text-sm border-b-1/2 border-transparent relative before:absolute before:rounded before:bg-b-2 before:opacity-0 hover:before:opacity-100 before:h-[calc(100%-4px)] before:w-[calc(100%+8px)] before:z-1 before:top-0.5 before:left-[-4px] cursor-pointer font-medium text-c-3"
              :class="{
                '!text-c-1 !border-current border-b-[1px] !rounded-none':
                  layout === 'client' &&
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
          :flow="flow!"
          :layout="layout"
          :scheme="scheme" />
      </template>
    </template>

    <!-- Open ID Connect -->
    <template v-else-if="scheme.type === 'openIdConnect'">
      <div
        class="text-c-3 px-4 text-sm min-h-16 justify-center flex items-center bg-b-1">
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
