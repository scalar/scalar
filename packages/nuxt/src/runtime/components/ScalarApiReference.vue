<script lang="ts" setup>
import { useHead, useRequestURL, useSeoMeta } from '#imports'
import { ModernLayout, parse } from '@scalar/api-reference'
import { reactive, ref, toRaw } from 'vue'
import type { Configuration } from '~/src/types'

const props = defineProps<{
  configuration: Configuration
}>()

if (props.configuration.theme === 'nuxt') {
  useHead({
    link: [
      {
        rel: 'stylesheet',
        href: new URL('./nuxt-theme.css', import.meta.url).href,
      },
    ],
  })
}

const isDark = ref(props.configuration.darkMode)

// Grab spec if we can
const content: unknown = props.configuration.spec?.content
  ? toRaw(props.configuration.spec.content)
  : props.configuration.spec?.url
    ? await $fetch(props.configuration.spec?.url)
    : await $fetch('/_nitro/openapi.json')

// Check for empty spec
if (!content)
  throw new Error('You must provide a spec for Scalar API References')

const parsedSpec = reactive(await parse(content))
const rawSpec = JSON.stringify(content)

// Load up the metadata
if (props.configuration?.metaData) useSeoMeta(props.configuration.metaData)

useHead({
  bodyAttrs: {
    class: () => (isDark.value ? 'dark-mode' : 'light-mode'),
  },
})

// Add baseServerURL
const { origin } = useRequestURL()
const config = {
  baseServerURL: origin,
  ...props.configuration,
}
</script>

<template>
  <ModernLayout
    :configuration="config"
    :isDark="isDark"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @toggleDarkMode="isDark = !isDark" />
</template>
