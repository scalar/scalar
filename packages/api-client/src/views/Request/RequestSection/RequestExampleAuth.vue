<script setup lang="ts">
import RequestAuthDataTableInput from '@/views/Request/RequestSection/RequestAuthDataTableInput.vue'
import { OAuth2 } from '@/views/Request/components'
import {
  ADD_AUTH_DICT,
  ADD_AUTH_OPTIONS,
  type SecuritySchemeGroup,
  type SecuritySchemeOption,
} from '@/views/Request/consts'
import { camelToTitleWords } from '@scalar/oas-utils/helpers'
import { capitalize, computed, ref } from 'vue'
</script>
<template>
  <!-- Loop over for multiple auth selection -->
  <template
    v-for="(scheme, index) in activeSecuritySchemes"
    :key="scheme.uid">
    <!-- Header -->
    <DataTableRow
      v-if="activeSecuritySchemes.length > 1"
      class="group/delete">
      <DataTableCell
        class="text-c-2 pl-2 text-xs font-medium flex items-center bg-b-2">
        {{ labels[index] }}
      </DataTableCell>
    </DataTableRow>

    <!-- HTTP -->
    <template v-if="scheme.type === 'http'">
      <!-- Bearer -->
      <DataTableRow v-if="scheme.scheme === 'bearer'">
        <RequestAuthDataTableInput
          :id="`http-bearer-token-${scheme.uid}`"
          :modelValue="scheme.value"
          placeholder="Token"
          type="password"
          @update:modelValue="(v) => updateScheme(scheme, 'value', v)">
          Bearer Token
        </RequestAuthDataTableInput>
      </DataTableRow>

      <!-- HTTP Basic -->
      <template v-else-if="scheme.scheme === 'basic'">
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`http-basic-username-${scheme.uid}`"
            class="text-c-2"
            :modelValue="scheme.value"
            placeholder="ScalarEnjoyer01"
            required
            @update:modelValue="(v) => updateScheme(scheme, 'value', v)">
            Username
          </RequestAuthDataTableInput>
        </DataTableRow>
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`http-basic-password-${scheme.uid}`"
            :modelValue="scheme.secondValue"
            placeholder="xxxxxx"
            type="password"
            @update:modelValue="(v) => updateScheme(scheme, 'secondValue', v)">
            Password
          </RequestAuthDataTableInput>
        </DataTableRow>
      </template>
    </template>

    <!-- API Key -->
    <template v-else-if="scheme.type === 'apiKey'">
      <!-- Custom auth -->
      <template v-if="!isReadOnly">
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`api-key-name-${scheme.uid}`"
            :modelValue="scheme.name"
            placeholder="api-key"
            @update:modelValue="(v) => updateScheme(scheme, 'name', v)">
            Name
          </RequestAuthDataTableInput>
        </DataTableRow>
        <DataTableRow>
          <RequestAuthDataTableInput
            :id="`api-key-value-add-${scheme.uid}`"
            :modelValue="scheme.value"
            placeholder="QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT"
            @update:modelValue="(v) => updateScheme(scheme, 'value', v)">
            Value
          </RequestAuthDataTableInput>
        </DataTableRow>
      </template>

      <DataTableRow v-else>
        <RequestAuthDataTableInput
          :id="`api-key-value-${scheme.uid}`"
          :modelValue="scheme.value"
          placeholder="Value"
          @update:modelValue="(v) => updateScheme(scheme, 'value', v)">
          {{ scheme.name }}
        </RequestAuthDataTableInput>
      </DataTableRow>
    </template>

    <!-- OAuth 2 -->
    <OAuth2
      v-else-if="scheme.type === 'oauth2'"
      :scheme="scheme" />
  </template>
</template>
