<script lang="ts" setup>
import { ApiReferenceWorkspace } from '@scalar/api-reference'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { createWorkspaceStore } from '@scalar/workspace-store/client'
import {
  useAsyncData,
  useFetch,
  useHead,
  useRequestURL,
  useRoute,
  useSeoMeta,
  useState,
} from '#imports'
import { onMounted, ref, toRaw, watch } from 'vue'

import type { Configuration } from '../../types'

const props = defineProps<{
  configuration: Configuration
}>()

const isDark = ref(props.configuration.darkMode)
const forcedMode = props.configuration.forceDarkModeState

const { colorMode, toggleColorMode } = useColorMode({
  initialColorMode: props.configuration.darkMode ? 'dark' : 'light',
  overrideColorMode: props.configuration.forceDarkModeState,
})

// @ts-expect-error support the old syntax for a bit
const content = props.configuration.spec?.content ?? props.configuration.content
// @ts-expect-error support the old syntax for a bit
const url = props.configuration.spec?.url ?? props.configuration.url

// Get the route to check if OpenAPI is enabled
const currentRoute = useRoute()
const meta = currentRoute.meta as { isOpenApiEnabled?: boolean }

// Grab spec if we can
const document = useState<string | null>('document', () => null)

// If the document is not set, we need to fetch it
if (!document.value) {
  // If the content is a function, we need to call it
  if (typeof content === 'function') {
    document.value = content()
  }
  // Otherwise its a string
  else if (content) {
    document.value = content
  }
  // Fetch the url
  else if (url) {
    try {
      const response = await useFetch<string>(url, { responseType: 'text' })
      document.value = response.data.value || null
    } catch (error) {
      console.error('Failed to fetch spec from URL:', error)
    }
  }
  // Or grab from nitro
  else if (meta.isOpenApiEnabled) {
    try {
      // Use useAsyncData for proper server-to-client data flow
      const { data } = await useAsyncData('openapi-spec', async () => {
        const response = await $fetch<string>('/_openapi.json', {
          responseType: 'text',
        })
        return response
      })
      document.value = data.value || null
    } catch (error) {
      console.error('Failed to fetch OpenAPI spec from /_openapi.json:', error)
    }
  }
}

// Set the fetched spec to the config content to prevent ApiReferenceLayout from fetching it again on the client side
props.configuration.content = document.value

// Check for empty spec
if (!document) {
  throw new Error(
    'You must provide a document for Scalar API References. Either provide a spec URL/content, or enable experimental openAPI in the Nitro config.',
  )
}

// Load up the metadata
if (props.configuration?.metaData) {
  useSeoMeta(props.configuration.metaData)
}

useHead({
  script: [
    {
      // Inject dark / light detection that runs before loading Nuxt to avoid flicker
      // This is a bit of a hack inspired by @nuxtjs/color-mode, but it works
      id: 'scalar-color-mode-script',
      tagPosition: 'bodyClose',
      innerHTML: `((isDark, forced) => {
        try {
          const stored = window.localStorage.getItem('colorMode');
          const useDark = forced === 'dark' || !forced && (stored === 'dark' || !stored && isDark);
          window.document.body.classList.add(useDark ? 'dark-mode' : 'light-mode');
        } catch {}
      })(${isDark.value}, ${JSON.stringify(forcedMode)});`
        .replace(/[\n\r]/g, '')
        .replace(/ +/g, ' '),
    },
  ],
})

watch(colorMode, () => {
  isDark.value = colorMode.value === 'dark'
})

onMounted(() => {
  // Adjust the color mode toggle switch
  isDark.value = window.document.body.classList.contains('dark-mode')
  // Remove scalar-color-mode-script
  window.document.getElementById('scalar-color-mode-script')?.remove()
})

// Add baseServerURL and _integration
const { origin } = useRequestURL()

const config: Partial<ApiReferenceConfiguration> = {
  baseServerURL: origin,
  _integration: 'nuxt',
  layout: 'modern',
  ...props.configuration,
}

const route = useRoute()

// Lets create the new workspace store as well
const store = createWorkspaceStore()

// Parse the document if it's a string
let parsedDocument: Record<string, unknown>
if (typeof document.value === 'string') {
  try {
    parsedDocument = JSON.parse(document.value)
  } catch (error) {
    console.error('Failed to parse OpenAPI document:', error)
    throw new Error('Invalid OpenAPI document format')
  }
} else {
  if (document.value && typeof document.value === 'object') {
    parsedDocument = document.value
  } else {
    throw new Error('Document must be a valid OpenAPI object')
  }
}

store.addDocument({
  name: route.name as string,
  document: parsedDocument,
})
</script>

<template>
  <ApiReferenceWorkspace
    :store
    :configuration="config" />
</template>

<style>
@import './nuxt-theme.css';
</style>
