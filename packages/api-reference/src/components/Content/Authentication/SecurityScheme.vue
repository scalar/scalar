<script lang="ts" setup>
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'

defineProps<{
  value:
    | OpenAPIV2.SecuritySchemeObject
    | OpenAPIV3.SecuritySchemeObject
    | OpenAPIV3_1.SecuritySchemeObject
}>()
</script>
<template>
  <div class="security-scheme">
    <div v-if="!value.type">
      <h3 class="security-scheme-title">No Authentication</h3>
    </div>
    <div v-else-if="value.type === 'apiKey'">
      <h3 class="security-scheme-title">API Key</h3>
      <div v-if="value.description">
        {{ value.description }}
      </div>
      <div>
        <div class="input">
          <label :for="value.name">
            Token {{ value.in.charAt(0).toUpperCase() + value.in.slice(1) }}
          </label>
          <input
            autocomplete="off"
            placeholder="Token"
            spellcheck="false"
            type="text" />
        </div>
      </div>
    </div>
    <div v-else-if="value.type === 'http'">
      <div v-if="value.scheme === 'basic'">
        <h3 class="security-scheme-title">Basic Auth</h3>
        <div class="input">
          <label for="username">Username</label>
          <input
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="text" />
        </div>
        <div class="input">
          <label for="password">Password</label>
          <input
            autocomplete="off"
            placeholder="Username"
            spellcheck="false"
            type="password" />
        </div>
      </div>
      <div v-else-if="value.scheme === 'bearer'">
        <h3 class="security-scheme-title">Bearer Token</h3>
        <div class="input">
          <label for="token">Token</label>
          <input
            autocomplete="off"
            placeholder="Token"
            spellcheck="false"
            type="text" />
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

.security-scheme-title {
  font-weight: var(--theme-bold, var(--default-theme-bold));
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
