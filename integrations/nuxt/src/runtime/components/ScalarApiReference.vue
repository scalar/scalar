<script lang="ts" setup>
import { ModernLayout, parse } from '@scalar/api-reference'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'
import { useHead, useRequestURL, useSeoMeta } from '#imports'
import type { Configuration } from '~/src/types'
import { reactive, ref, toRaw } from 'vue'

const props = defineProps<{
  configuration: Configuration
}>()

const isDark = ref(props.configuration.darkMode)
const theme = ref(props.configuration.theme)

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
        ? await $fetch<string>(url)
        : await $fetch<string>('/_openapi.json')

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
  bodyAttrs: {
    class: () => (isDark.value ? 'dark-mode' : 'light-mode'),
  },
})

// Add baseServerURL and _integration
const { origin } = useRequestURL()

const config: Partial<ApiReferenceConfiguration> = {
  baseServerURL: origin,
  _integration: 'nuxt',
  ...props.configuration,
}
</script>

<template>
  <ModernLayout
    :configuration="config"
    :isDark="!!isDark"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @changedTheme="theme"
    @toggleDarkMode="isDark = !isDark" />
</template>

<style>
@import './nuxt-theme.css';
</style>
