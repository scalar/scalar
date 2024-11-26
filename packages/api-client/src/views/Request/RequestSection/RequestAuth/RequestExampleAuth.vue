<script setup lang="ts">
import { DataTableCell, DataTableRow } from '@/components/DataTable'
import { useWorkspace } from '@/store'
import type { SecurityScheme } from '@scalar/oas-utils/entities/spec'
import type { Path, PathValue } from '@scalar/object-utils/nested'
import { capitalize, computed } from 'vue'

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

const generateLabel = (scheme: SecurityScheme) => {
  if (scheme.type !== 'oauth2')
    return `${capitalize(scheme.nameKey)}: ${scheme.type}`

  const firstFlow = Object.values(scheme.flows ?? {})[0]
  return `${capitalize(scheme.nameKey)}: ${scheme.type} ${scheme.type === 'oauth2' && firstFlow ? firstFlow.type : ''}`
}

/** Update the scheme */
const updateScheme = <U extends string, P extends Path<SecurityScheme>>(
  uid: U,
  path: P,
  value: NonNullable<PathValue<SecurityScheme, P>>,
) => securitySchemeMutators.edit(uid, path, value)

const baseReferenceClass = 'bg-b-2 border-l-1/2 last:border-r-1/2'
/** To override the styling when we are in references */
const getReferenceClass = (className: string) =>
  layout === 'reference' ? `${baseReferenceClass} ${className}` : ''
</script>
<template>
  <!-- Loop over for multiple auth selection -->
  <template
    v-for="{ scheme } in security"
    :key="scheme.uid">
    <!-- Header -->
    <DataTableRow class="group/delete">
      <DataTableCell
        v-if="security.length > 1"
        class="text-c-3 border-b-0 pl-2 font-medium flex items-center">
        {{ generateLabel(scheme) }}
      </DataTableCell>
    </DataTableRow>

    <!-- HTTP -->
    <template v-if="scheme.type === 'http'">
      <!-- Bearer -->
      <DataTableRow v-if="scheme.scheme === 'bearer'">
        <RequestAuthDataTableInput
          :id="`http-bearer-token-${scheme.uid}`"
          :containerClass="getReferenceClass('rounded border-1/2')"
          :modelValue="scheme.token"
          placeholder="Token"
          type="password"
          @update:modelValue="(v) => updateScheme(scheme.uid, 'token', v)">
          Bearer Token
        </RequestAuthDataTableInput>
      </DataTableRow>

      <!-- HTTP Basic -->
      <template v-else-if="scheme.scheme === 'basic'">
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`http-basic-username-${scheme.uid}`"
            class="text-c-2"
            :containerClass="getReferenceClass('rounded-t border-t-1/2')"
            :modelValue="scheme.username"
            placeholder="ScalarEnjoyer01"
            required
            @update:modelValue="(v) => updateScheme(scheme.uid, 'username', v)">
            Username
          </RequestAuthDataTableInput>
        </DataTableRow>
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`http-basic-password-${scheme.uid}`"
            :containerClass="getReferenceClass('rounded-b')"
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
    <template v-else-if="scheme.type === 'apiKey'">
      <DataTableRow>
        <RequestAuthDataTableInput
          :id="`api-key-name-${scheme.uid}`"
          :containerClass="getReferenceClass('rounded-t border-t-1/2')"
          :modelValue="scheme.name"
          placeholder="api-key"
          @update:modelValue="(v) => updateScheme(scheme.uid, 'name', v)">
          Name
        </RequestAuthDataTableInput>
      </DataTableRow>
      <DataTableRow>
        <RequestAuthDataTableInput
          :id="`api-key-value-add-${scheme.uid}`"
          :containerClass="getReferenceClass('rounded-b')"
          :modelValue="scheme.value"
          placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
          @update:modelValue="(v) => updateScheme(scheme.uid, 'value', v)">
          Value
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- OAuth 2 -->
    <template v-else-if="scheme.type === 'oauth2'">
      <OAuth2
        v-for="(flow, key) in scheme.flows"
        :key="key"
        :flow="flow!"
        :scheme="scheme" />
    </template>
  </template>
</template>
