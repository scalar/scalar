<script lang="ts" setup>
import {
  ModernLayout,
  type ReferenceConfiguration,
  parse,
} from '@scalar/api-reference'
import '@scalar/api-reference/index.css'
import { computed, reactive } from 'vue'

import './nuxt-theme.css'

const props = defineProps<{
  configuration: Pick<
    ReferenceConfiguration,
    'darkMode' | 'pathRouting' | 'proxy' | 'showSidebar' | 'spec'
  >
}>()

// Set defaults as needed on the provided configuration
const configuration = computed<ReferenceConfiguration>(() => ({
  spec: {
    content: undefined,
    url: undefined,
    ...props.configuration?.spec,
  },
  darkMode: true,
  proxy: undefined,
  showSidebar: true,
  isEditable: false,
  pathRouting: {
    basePath: '/scalar',
  },
  ...props.configuration,
}))

const isDark = ref(configuration.value.darkMode ?? true)

// Grab spec if we can
const content: unknown = props.configuration.spec?.content
  ? props.configuration.spec.content
  : props.configuration.spec?.url
    ? await $fetch(props.configuration.spec?.url)
    : await $fetch('/_nitro/openapi.json')

// Check for empty spec
if (!content)
  throw new Error('You must provide a spec to the Scalar API Reference')

const parsedSpec = reactive(await parse(content))
const rawSpec = JSON.stringify(content)

useHead({
  bodyAttrs: {
    class: () => (isDark.value ? 'dark-mode' : 'light-mode'),
  },
})
</script>

<template>
  <ModernLayout
    :configuration="configuration"
    :isDark="isDark"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec"
    @toggleDarkMode="isDark = !isDark">
  </ModernLayout>
</template>
