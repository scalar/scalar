<script lang="ts" setup>
import { useGlobalStore } from '../../../stores'
import MarkdownRenderer from '../MarkdownRenderer.vue'

defineProps<{
  value?: any
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
    <form>
      <!-- <div
      v-if="value.description"
      class="description">
      <MarkdownRenderer :value="value.description" />
    </div> -->
      <div v-if="!value.type"></div>
      <div v-else-if="value.type === 'apiKey'">
        <div class="input">
          <label :for="`security-scheme-${value.name}`">
            {{ value.in.charAt(0).toUpperCase() + value.in.slice(1) }} API Key
          </label>
          <input
            :id="`security-scheme-${value.name}`"
            autocomplete="off"
            placeholder="Token"
            spellcheck="false"
            type="text"
            :value="authentication.apiKey.token"
            @input="handleApiKeyTokenInput" />
        </div>
      </div>
      <div v-else-if="value.type === 'http' || value.type === 'basic'">
        <div v-if="value.type === 'basic' || value.scheme === 'basic'">
          <div class="input">
            <label for="http.basic.username">Username</label>
            <input
              id="http.basic.username"
              autocomplete="off"
              placeholder="Username"
              spellcheck="false"
              type="text"
              :value="authentication.http.basic.username"
              @input="handleHttpBasicUsernameInput" />
          </div>
          <div class="input">
            <label for="http.basic.password">Password</label>
            <input
              id="http.basic.password"
              autocomplete="off"
              placeholder="Password"
              spellcheck="false"
              type="password"
              :value="authentication.http.basic.password"
              @input="handleHttpBasicPasswordInput" />
          </div>
        </div>
        <div v-else-if="value.scheme === 'bearer'">
          <div class="input">
            <label for="http.bearer.token">Token</label>
            <input
              id="http.bearer.token"
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
        <p>The given security scheme ({{ value.type }}) is not supported.</p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.security-scheme {
  margin: 9px;
  color: var(--theme-color-1, var(--default-theme-color-1));
  border-radius: var(--theme-radius, var(--default-theme-radius));
  position: relative;
  box-shadow: 0 0 0 1px
    var(--theme-border-color, var(--default-theme-border-color));
}
.security-scheme :deep(.input:nth-of-type(3) ~ .input) {
  height: 0px;
  opacity: 0;
}
.security-scheme :deep(.input:nth-of-type(3):not(:last-child):before) {
  content: 'Show More...';
  white-space: nowrap;
  font-size: var(--theme-micro, var(--default-theme-micro));
  color: var(--theme-color-3, var(--default-theme-color-3));
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  pointer-events: none;
  position: absolute;
  padding: 9px;
}
.security-scheme :deep(.input:hover:before) {
  color: var(--theme-color-1, var(--default-theme-color-1)) !important;
}
.security-scheme:focus-within
  :deep(.input:nth-of-type(3):not(:last-child):before) {
  display: none;
}
.security-scheme:not(:focus-within)
  :deep(.input:nth-of-type(3):not(:last-child)) {
  box-shadow: none !important;
}
.security-scheme :deep(.input:nth-of-type(3):not(:last-child) input),
.security-scheme :deep(.input:nth-of-type(3):not(:last-child) label) {
  opacity: 0;
}
.security-scheme:focus-within :deep(.input:nth-of-type(3) input),
.security-scheme:focus-within :deep(.input:nth-of-type(3) label),
.security-scheme:focus-within :deep(.input:nth-of-type(3) ~ .input) {
  opacity: 1;
  height: fit-content;
  transition: opacity 0.3s ease-in-out;
}
.description {
  margin-bottom: 12px;
}

.work-in-progress {
  color: var(--theme-color-1, var(--default-theme-color-1));
  padding: 9px;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  font-size: var(--theme-micro, var(--default-theme-micro));
  display: flex;
  box-shadow: 0 0 0 1px
    var(--theme-color-yellow, var(--default-theme-color-yellow));
  position: relative;
}
.work-in-progress:before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: var(--theme-color-yellow, var(--default-theme-color-yellow));
  opacity: 0.1;
}
.work-in-progress-title {
  font-weight: var(--theme-semibold, var(--default-theme-semibold));
  font-size: var(--theme-micro, var(--default-theme-micro));
  margin-top: 0;
  margin-bottom: 0;
  margin-right: 6px;
}
</style>
