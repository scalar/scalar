<script lang="ts" setup>
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'

import { useGlobalStore } from '../../../stores'
import MarkdownRenderer from '../MarkdownRenderer.vue'

defineProps<{
  value?:
    | OpenAPIV2.SecuritySchemeObject
    | OpenAPIV3.SecuritySchemeObject
    | OpenAPIV3_1.SecuritySchemeObject
}>()

const { authentication, setAuthentication } = useGlobalStore()

const handleApiKeyTokenInput = (event: Event) => {
  setAuthentication({
    apiKey: {
      ...authentication.apiKey,
      token: (event.target as HTMLInputElement).value,
    },
  })
}

const handleHttpBasicUsernameInput = (event: Event) => {
  setAuthentication({
    http: {
      ...authentication.http,
      basic: {
        ...authentication.http.basic,
        username: (event.target as HTMLInputElement).value,
      },
    },
  })
}

const handleHttpBasicPasswordInput = (event: Event) => {
  setAuthentication({
    http: {
      ...authentication.http,
      basic: {
        ...authentication.http.basic,
        password: (event.target as HTMLInputElement).value,
      },
    },
  })
}

const handleHttpBearerTokenInput = (event: Event) => {
  setAuthentication({
    http: {
      ...authentication.http,
      bearer: {
        ...authentication.http.bearer,
        token: (event.target as HTMLInputElement).value,
      },
    },
  })
}
</script>
<template>
  <div
    v-if="value"
    class="security-scheme">
    <div
      v-if="value.description"
      class="description">
      <MarkdownRenderer :value="value.description" />
    </div>
    <div v-if="!value.type"></div>
    <div v-else-if="value.type === 'apiKey'">
      <div>
        <div class="input">
          <label :for="value.name">
            {{ value.in.charAt(0).toUpperCase() + value.in.slice(1) }} API Key
          </label>
          <input
            autocomplete="off"
            placeholder="Token"
            spellcheck="false"
            type="text"
            :value="authentication.apiKey.token"
            @input="handleApiKeyTokenInput" />
        </div>
      </div>
    </div>
    <div v-else-if="value.type === 'http' || value.type === 'basic'">
      <div v-if="value.type === 'basic' || value.scheme === 'basic'">
        <div class="input">
          <label for="username">Username</label>
          <input
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="text"
            :value="authentication.http.basic.username"
            @input="handleHttpBasicUsernameInput" />
        </div>
        <div class="input">
          <label for="password">Password</label>
          <input
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="password"
            :value="authentication.http.basic.password"
            @input="handleHttpBasicPasswordInput" />
        </div>
      </div>
      <div v-else-if="value.scheme === 'bearer'">
        <div class="input">
          <label for="token">Token</label>
          <input
            autocomplete="off"
            placeholder="Token"
            spellcheck="false"
            type="text"
            :value="authentication.http.bearer.token"
            @input="handleHttpBearerTokenInput" />
        </div>
      </div>
    </div>
    <div
      v-else
      class="work-in-progress">
      <h3 class="work-in-progress-title">Work in Progress</h3>
      <p>The given security scheme ({{ value.type }}) is not yet supported.</p>
    </div>
  </div>
</template>

<style scoped>
.security-scheme {
  margin-bottom: 24px;
  color: var(--theme-color-1, var(--default-theme-color-1));
}

.description {
  margin-bottom: 12px;
}

.work-in-progress {
  color: var(--theme-color-orange, var(--default-theme-color-orange));
  border: 1px solid var(--theme-color-orange, var(--default-theme-color-orange));
  padding: 24px;
  border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
}

.work-in-progress-title {
  font-weight: var(--theme-bold, var(--default-theme-bold));
  margin-bottom: 12px;
}
</style>
