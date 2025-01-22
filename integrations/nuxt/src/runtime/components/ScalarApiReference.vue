<script lang="ts" setup>
import { useHead, useRequestURL, useSeoMeta } from '#imports'
import { ModernLayout, parse } from '@scalar/api-reference'
import type { ReferenceConfiguration } from '@scalar/types/legacy'
import { reactive, ref, toRaw } from 'vue'
import type { Configuration } from '~/src/types'

const props = defineProps<{
  configuration: Configuration
}>()

const isDark = ref(props.configuration.darkMode)

// Grab spec if we can
const content =
  typeof props.configuration.spec?.content === 'function'
    ? toRaw(props.configuration.spec.content())
    : props.configuration.spec?.content
      ? toRaw(props.configuration.spec.content)
      : props.configuration.spec?.url
        ? await $fetch<string>(props.configuration.spec?.url)
        : await $fetch<string>('/_openapi.json')

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

// Add baseServerURL and _integration
const { origin } = useRequestURL()

const config: Partial<ReferenceConfiguration> = {
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
    @toggleDarkMode="isDark = !isDark" />
</template>

<style>
@import './nuxt-theme.css';
</style>
