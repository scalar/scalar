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
    'pathRouting' | 'proxy' | 'showSidebar' | 'spec'
  >
}>()

// Set defaults as needed on the provided configuration
const configuration = computed<ReferenceConfiguration>(() => ({
  spec: {
    content: undefined,
    url: undefined,
    ...props.configuration?.spec,
  },
  proxy: undefined,
  showSidebar: true,
  isEditable: false,
  pathRouting: {
    basePath: '/scalar',
  },
  ...props.configuration,
}))

// Grab spec from URL
const content: unknown = props.configuration.spec?.content
  ? props.configuration.spec.content
  : await $fetch(props.configuration.spec?.url ?? '')

const parsedSpec = reactive(await parse(content))
const rawSpec = JSON.stringify(content)

// TODO control dark mode
useHead({
  bodyAttrs: {
    class: 'dark-mode',
  },
})
</script>

<template>
  <ModernLayout
    :configuration="configuration"
    isDark
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec">
  </ModernLayout>
</template>
