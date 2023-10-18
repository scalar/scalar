<script lang="ts" setup>
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'

import { useGlobalStore } from '../../../stores'
import { type AuthenticationType } from '../../../types'
import SecurityScheme from './SecurityScheme.vue'

defineProps<{
  value: Record<
    string,
    | OpenAPIV2.SecuritySchemeObject
    | OpenAPIV3.SecuritySchemeObject
    | OpenAPIV3_1.SecuritySchemeObject
  >
}>()
const { authentication, setAuthentication } = useGlobalStore()

const handleAuthenticationTypeInput = (event: Event) => {
  setAuthentication({
    type: (event.target as HTMLSelectElement).value as AuthenticationType,
  })
}
</script>
<template>
  <div class="security-schemes">
    <div class="security-schemes-selector">
      <select
        @input="handleAuthenticationTypeInput"
        @value="authentication.type">
        <template
          v-for="key in Object.keys(value)"
          :key="key">
          <option :value="key">
            <template v-if="!value[key].type">No Authentication</template>
            <template v-else-if="value[key].type === 'apiKey'">
              API Key
            </template>
            <template
              v-else-if="
                value[key].type === 'http' && value[key].scheme === 'basic'
              ">
              Basic Authentication
            </template>
            <template
              v-else-if="
                value[key].type === 'http' &&
                value[key].scheme &&
                value[key].scheme === 'bearer'
              ">
              Bearer Authentication
            </template>
            <template v-else>
              Not yet supported: {{ value[key].type }}
            </template>
          </option>
        </template>
      </select>
    </div>
    <SecurityScheme :value="value[authentication.type]" />
  </div>
</template>

<style scoped>
.security-schemes {
  display: flex;
  gap: 24px;
  flex-direction: column;
}
</style>
