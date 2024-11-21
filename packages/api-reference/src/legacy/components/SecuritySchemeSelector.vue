<script lang="ts" setup>
import {
  ScalarButton,
  ScalarIcon,
  ScalarListbox,
  type ScalarListboxOption,
} from '@scalar/components'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from '@scalar/openapi-types'
import { computed, onMounted, onServerPrefetch } from 'vue'

import { useApiClient } from '../../features/ApiClientModal/useApiClient'
import { useAuthenticationStore } from '../stores'

const props = defineProps<{
  value?:
    | OpenAPIV2.SecurityDefinitionsObject
    | OpenAPIV3.ComponentsObject['securitySchemes']
    | OpenAPIV3_1.ComponentsObject['securitySchemes']
}>()

// Emit updates
const emits = defineEmits<{
  (event: 'input', key: string): void
}>()

const { authentication, setAuthentication } = useAuthenticationStore()
const { client } = useApiClient()

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

  // Set it in the client as well
  if (client.value?.store) {
    const { collections, collectionMutators, securitySchemes } =
      client.value.store

    const collectionUid = Object.keys(collections)[0]
    const securityScheme = Object.values(securitySchemes).find(
      ({ nameKey }) => nameKey === key,
    )

    if (securityScheme && collectionUid) {
      collectionMutators.edit(collectionUid, 'selectedSecuritySchemeUids', [
        securityScheme.uid,
      ])
    }
  }

  emits('input', key)
}

onServerPrefetch(() =>
  setSecuritySchemeKey(Object.keys(props.value ?? {})[0] ?? null),
)

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
  return `${getAuthorizationTypeLabel(item)} (${key})`
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
    if (item.flows?.implicit) {
      return 'OAuth 2.0 Implicit'
    }

    if (item.flows?.password) {
      return 'OAuth 2.0 Password'
    }

    return 'OAuth 2.0'
  }

  return `${item.type} (not yet supported)`
}

// Alias
const keys = computed(() => Object.keys(props.value ?? {}))

const options = computed<ScalarListboxOption[]>(() =>
  keys.value.map((key) => ({
    id: key,
    label: getLabelForScheme(props.value?.[key], key),
  })),
)

const selected = computed<ScalarListboxOption | undefined>({
  get: () =>
    options.value?.find(
      (opt) => opt.id === authentication.preferredSecurityScheme,
    ),
  set: (opt?: ScalarListboxOption) => setSecuritySchemeKey(opt?.id ?? ''),
})
</script>
<template>
  <!-- Single security scheme -->
  <template v-if="keys.length === 1">
    <!-- Use <div> to avoid unnecessary styles added by `CollapsibleSection` -->
    <div class="security-scheme-label text-sm text-c-3">
      {{ getLabelForScheme(value?.[keys[0]], keys[0]) }}
    </div>
  </template>

  <!-- Multiple security schemes -->
  <template v-else-if="keys.length > 1">
    <ScalarListbox
      v-model="selected"
      label="Security Scheme"
      :options="options"
      resize>
      <ScalarButton
        class="security-scheme-button"
        fullWidth
        variant="ghost">
        <span class="sr-only">Selected:</span>
        {{
          authentication.preferredSecurityScheme
            ? getLabelForScheme(
                value?.[authentication.preferredSecurityScheme],
                authentication.preferredSecurityScheme,
              )
            : 'No Authentication'
        }}
        <ScalarIcon
          icon="ChevronDown"
          size="xs" />
      </ScalarButton>
    </ScalarListbox>
  </template>
</template>

<style scoped>
.security-scheme-button {
  color: var(--scalar-color-3);
  display: inline-flex;
  gap: 4px;
  height: auto;
  padding: 0 !important; /* fix for non tailwind padding */
  text-transform: uppercase;
}
.security-scheme-selector:hover {
  color: var(--scalar-color-1);
}
</style>
