<script lang="ts" setup>
import { useAuthenticationStore } from '@scalar/api-client'
import { ScalarIcon } from '@scalar/components'
import type { OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-parser'
import { computed, onMounted } from 'vue'

const props = defineProps<{
  value?:
    | {
        [key: string]:
          | OpenAPIV3.SecuritySchemeObject
          | OpenAPIV3.ReferenceObject
      }
    | Record<
        string,
        OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.ReferenceObject
      >
    | undefined
}>()

// Emit updates
const emits = defineEmits<{
  (event: 'input', key: string): void
}>()

const { authentication, setAuthentication } = useAuthenticationStore()

// Update credentials in state
const handleAuthenticationTypeInput = (event: Event) => {
  setSecuritySchemeKey((event.target as HTMLSelectElement).value)
}

// Use first security scheme as default
onMounted(() => {
  // Oh, the key was set already!
  if (authentication.preferredSecurityScheme) {
    return
  }

  // Set the authentication type to the first security scheme
  setSecuritySchemeKey(Object.keys(props.value ?? {})[0] ?? null)
})

// Update current security scheme key
const setSecuritySchemeKey = (key: string) => {
  setAuthentication({
    preferredSecurityScheme: key,
  })

  emits('input', key)
}

const isNone = (item: any) => !item?.type

const isApiKey = (item: any) => item.type.toLowerCase() === 'apikey'

const isHttpBasic = (item: any) =>
  (item.type === 'http' && item.scheme.toLowerCase() === 'basic') ||
  item.type.toLowerCase() === 'basic'

const isHttpBearer = (item: any) =>
  item.type === 'http' && item.scheme.toLowerCase() === 'bearer'

const isOAuth2 = (item: any) => item.type.toLowerCase() === 'oauth2'

// Translate type to label
const getLabelForScheme = (item: any, key: string) => {
  return `${key} (${getAuthorizationTypeLabel(item)})`
}

// Translate type to label
const getAuthorizationTypeLabel = (item: any) => {
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

// Alias
const keys = computed(() => Object.keys(props.value ?? {}))
</script>
<template>
  <!-- Single security scheme -->
  <template v-if="keys.length === 1">
    {{ getLabelForScheme(value?.[keys[0]], keys[0]) }}
  </template>

  <!-- Multiple security schemes -->
  <template v-else-if="keys.length > 1">
    <div class="security-scheme-selector">
      <span>
        {{
          authentication.preferredSecurityScheme
            ? getLabelForScheme(
                value?.[authentication.preferredSecurityScheme],
                authentication.preferredSecurityScheme,
              )
            : ''
        }}
      </span>
      <ScalarIcon icon="ChevronDown" />
      <select
        @input="handleAuthenticationTypeInput"
        @value="authentication.preferredSecurityScheme">
        <template
          v-for="key in keys"
          :key="key">
          <option :value="key ?? null">
            {{ getLabelForScheme(value?.[key], key) }}
          </option>
        </template>
      </select>
    </div>
  </template>
</template>

<style scoped>
.security-scheme-selector {
  position: relative;
  display: flex;
  border-radius: var(--theme-radius, var(--default-theme-radius));
  color: var(--theme-color-2, var(--default-theme-color-2));
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.security-scheme-selector:hover {
  color: var(--theme-color-1, var(--default-theme-color-1));
}
.security-scheme-selector span {
  font-size: var(--theme-mini, var(--default-theme-mini));
}
.security-scheme-selector select {
  opacity: 0;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  cursor: pointer;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
}

.security-scheme-selector svg {
  width: 12px;
  stroke: currentColor;
}
</style>
