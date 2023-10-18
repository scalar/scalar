<script lang="ts" setup>
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'
import { onMounted } from 'vue'

import { useGlobalStore } from '../../../stores'
import SecurityScheme from './SecurityScheme.vue'

const props = defineProps<{
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
    securitySchemeKey: (event.target as HTMLSelectElement).value,
  })
}

onMounted(() => {
  // Set the authentication type to the first security scheme
  setAuthentication({
    securitySchemeKey: Object.keys(props.value)[0] ?? null,
  })
})
</script>
<template>
  <div class="security-schemes">
    <div class="security-schemes-selector">
      <!-- <span>
        {{ authentication.securitySchemeKey }}
        <svg
          fill="none"
          height="100%"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="m19.5 10-7.5 7.5-7.5-7.5"
            xmlns="http://www.w3.org/2000/svg"></path>
        </svg>
      </span> -->
      <select
        @input="handleAuthenticationTypeInput"
        @value="authentication.securitySchemeKey">
        <template
          v-for="key in Object.keys(value)"
          :key="key">
          <option :value="key ?? null">
            <template v-if="!value[key].type">No Authentication</template>
            <template v-else-if="value[key].type === 'apiKey'">
              API Key
            </template>
            <template
              v-else-if="
                (value[key].type === 'http' && value[key].scheme === 'basic') ||
                value[key].type === 'basic'
              ">
              Basic Authentication
            </template>
            <template
              v-else-if="
                value[key].type === 'http' && value[key].scheme === 'bearer'
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
    <SecurityScheme
      v-if="authentication.securitySchemeKey"
      :value="value[authentication.securitySchemeKey]" />
  </div>
</template>

<style scoped>
.security-schemes {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

/* .security-schemes-selector span {
  background: transparent;
  padding: 2px 0;
  border-radius: 3px;
  font-size: var(--theme-small, var(--default-theme-small));
  pointer-events: none;
  color: var(--theme-color-2, var(--default-theme-color-2));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.security-schemes-selector:hover span {
  color: var(--theme-color-1, var(--default-theme-color-1));
  border-color: currentColor;
}
.security-schemes-selector span svg {
  width: 15px;
  height: 15px;
  margin-left: 3px;
}

.security-schemes-selector select {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
} */
</style>
