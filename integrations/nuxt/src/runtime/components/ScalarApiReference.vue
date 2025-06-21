<script lang="ts" setup>
import { ApiReferenceLayout, parse } from '@scalar/api-reference'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { useFetch, useHead, useRequestURL, useSeoMeta } from '#imports'
import type { Configuration } from '~/src/types'
import { onMounted, reactive, ref, toRaw, watch } from 'vue'

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

// Grab spec if we can
const document =
  typeof content === 'function'
    ? toRaw(content())
    : content
      ? toRaw(content)
      : url
        ? (await useFetch<string>(url, { responseType: 'text' })).data.value
        : (await useFetch<string>('/_openapi.json', { responseType: 'text' }))
            .data.value

// Set the fetched spec to the config content to prevent ApiReferenceLayout from fetching it again on the client side
props.configuration.content = document

// Check for empty spec
if (!document) {
  throw new Error('You must provide a document for Scalar API References')
}

const parsedSpec = reactive(await parse(document))
const rawSpec = JSON.stringify(document)

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
</script>

<template>
  <ApiReferenceLayout
    :configuration="config"
    :isDark="!!isDark"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @toggleDarkMode="() => toggleColorMode()" />
</template>

<style>
@import './nuxt-theme.css';
</style>
