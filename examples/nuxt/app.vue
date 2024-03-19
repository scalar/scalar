<script lang="ts" setup>
import { ModernLayout, parse } from '@scalar/api-reference'
// import { parse } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'
import { reactive } from 'vue'

// import ModernLayout from '../../packages/api-reference/src/components/Layouts/ModernLayout.vue'
import content from '../web/src/fixtures/petstorev3.json'

const rawSpec = JSON.stringify(content)
const configuration = { showSidebar: true, spec: { content } }
const parsedSpec = reactive(await parse(content))

useHead({
  bodyAttrs: {
    class: 'dark-mode',
  },
})
</script>
<template>
  <ModernLayout
    :configuration="configuration"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec">
  </ModernLayout>
</template>
