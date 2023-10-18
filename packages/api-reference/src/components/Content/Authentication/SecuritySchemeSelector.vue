<script lang="ts" setup>
import { onMounted } from 'vue'

import { useGlobalStore } from '../../../stores'

const props = defineProps<{
  // TODO: Add type
  value: any
}>()

const emits = defineEmits<{
  (event: 'input', key: string): void
}>()

const { authentication, setAuthentication } = useGlobalStore()

const handleAuthenticationTypeInput = (event: Event) => {
  setSecuritySchemeKey((event.target as HTMLSelectElement).value)
}

onMounted(() => {
  // Set the authentication type to the first security scheme
  setSecuritySchemeKey(Object.keys(props.value)[0] ?? null)
})

const setSecuritySchemeKey = (key: string) => {
  setAuthentication({
    securitySchemeKey: key,
  })

  emits('input', key)
}

const isNone = (item: any) => !item.type

const isApiKey = (item: any) => item.type === 'apiKey'

const isHttpBasic = (item: any) =>
  (item.type === 'http' && item.scheme === 'basic') || item.type === 'basic'

const isHttpBearer = (item: any) =>
  item.type === 'http' && item.scheme === 'bearer'

const isOAuth2 = (item: any) => item.type === 'oAuth2'

const getLabelForScheme = (item: any) => {
  if (isNone(item)) {
    return 'No Authentication'
  } else if (isApiKey(item)) {
    return 'API Key'
  } else if (isHttpBasic(item)) {
    return 'Basic Authentication'
  } else if (isHttpBearer(item)) {
    return 'Bearer Authentication'
  } else if (isOAuth2(item)) {
    return 'OAuth 2.0'
  }

  return `${item.type} (not yet supported)`
}
</script>
<template>
  <div class="security-scheme-selector">
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
    <span>
      {{
        authentication.securitySchemeKey
          ? getLabelForScheme(value[authentication.securitySchemeKey])
          : ''
      }}
    </span>
    <select
      @input="handleAuthenticationTypeInput"
      @value="authentication.securitySchemeKey">
      <template
        v-for="key in Object.keys(value)"
        :key="key">
        <option :value="key ?? null">
          {{ getLabelForScheme(value[key]) }}
        </option>
      </template>
    </select>
  </div>
</template>

<style scoped>
.security-scheme-selector {
  position: relative;
  display: flex;
  background: var(--theme-background-2, var(--default-theme-background-2));
  border-radius: var(--theme-radius, var(--default-theme-radius));
  color: var(--theme-color-2, var(--default-theme-color-2));
  display: flex;
  align-items: center;
  gap: 4px;
}

.security-scheme-selector span {
  font-size: var(--theme-micro, var(--default-theme-micro));
}
.security-scheme-selector select {
  opacity: 0;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.security-scheme-selector svg {
  width: 12px;
}
</style>
