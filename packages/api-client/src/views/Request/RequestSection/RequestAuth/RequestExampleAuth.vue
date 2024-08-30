<script setup lang="ts">
import { DataTableCell, DataTableRow } from '@/components/DataTable'
import { useWorkspace } from '@/store'
import RequestAuthDataTableInput from '@/views/Request/RequestSection/RequestAuthDataTableInput.vue'
import type {
  SecurityScheme,
  SecuritySchemeExampleValue,
} from '@scalar/oas-utils/entities/spec'
import { capitalize, computed } from 'vue'

import OAuth2 from './OAuth2.vue'

const { activeExample, isReadOnly, requestExampleMutators, securitySchemes } =
  useWorkspace()

const security = computed(() =>
  Object.entries(activeExample.value?.auth ?? {}).map(([uid, example]) => ({
    example,
    scheme: securitySchemes[uid],
  })),
)

function generateLabel(scheme: SecurityScheme) {
  return `${capitalize(scheme.nameKey)}: ${scheme.type} ${scheme.type === 'oauth2' ? scheme.flow.type : ''}`
}

function updateExampleValue<T extends SecuritySchemeExampleValue>(
  uid: string,
  /** Example instance added as property for type safety */
  exampleAuth: T,
  key: keyof T & string,
  value: string,
) {
  if (!activeExample.value?.uid) return

  requestExampleMutators.edit(
    activeExample.value.uid,
    `auth.${uid}.${key}`,
    value as any,
  )
}
</script>
<template>
  <!-- Loop over for multiple auth selection -->
  <template
    v-for="{ scheme, example } in security"
    :key="scheme.uid">
    <!-- Header -->
    <DataTableRow class="group/delete">
      <DataTableCell
        class="text-c-2 pl-2 text-xs font-medium flex items-center bg-b-2">
        {{ generateLabel(scheme) }}
      </DataTableCell>
    </DataTableRow>

    <!-- HTTP -->
    <template v-if="scheme.type === 'http' && example.type === 'http'">
      <!-- Bearer -->
      <DataTableRow v-if="scheme.scheme === 'bearer'">
        <RequestAuthDataTableInput
          :id="`http-bearer-token-${scheme.uid}`"
          :modelValue="example.token"
          placeholder="Token"
          type="password"
          @update:modelValue="
            (v) => updateExampleValue(scheme.uid, example, 'token', v)
          ">
          Bearer Token
        </RequestAuthDataTableInput>
      </DataTableRow>

      <!-- HTTP Basic -->
      <template v-else-if="scheme.scheme === 'basic'">
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`http-basic-username-${scheme.uid}`"
            class="text-c-2"
            :modelValue="example.username"
            placeholder="ScalarEnjoyer01"
            required
            @update:modelValue="
              (v) => updateExampleValue(scheme.uid, example, 'username', v)
            ">
            Username
          </RequestAuthDataTableInput>
        </DataTableRow>
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`http-basic-password-${scheme.uid}`"
            :modelValue="example.password"
            placeholder="xxxxxx"
            type="password"
            @update:modelValue="
              (v) => updateExampleValue(scheme.uid, example, 'password', v)
            ">
            Password
          </RequestAuthDataTableInput>
        </DataTableRow>
      </template>
    </template>

    <!-- API Key -->
    <template v-else-if="scheme.type === 'apiKey' && example.type === 'apiKey'">
      <!-- Custom auth -->
      <template v-if="!isReadOnly">
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`api-key-name-${scheme.uid}`"
            disabled
            :modelValue="scheme.name"
            placeholder="api-key">
            Name
          </RequestAuthDataTableInput>
        </DataTableRow>
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`api-key-value-add-${scheme.uid}`"
            :modelValue="example.value"
            placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
            @update:modelValue="
              (v) => updateExampleValue(scheme.uid, example, 'value', v)
            ">
            Value
          </RequestAuthDataTableInput>
        </DataTableRow>
      </template>
    </template>

    <!-- OAuth 2 -->
    <OAuth2
      v-else-if="scheme.type === 'oauth2'"
      :scheme="scheme" />
  </template>
</template>
