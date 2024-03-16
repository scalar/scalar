<script lang="ts" setup>
import { ApiReferenceLayout, parse } from '@scalar/api-reference'
import '@scalar/api-reference/style.css'

// import ModernLayout from '../../packages/api-reference/src/components/Layouts/ModernLayout.vue'
import content from '../web/src/fixtures/petstorev3.json'

const rawSpec = content
const configuration = { showSidebar: true, spec: { content } }
const parsedSpec = await parse(content)

useHead({
  bodyAttrs: {
    class: 'dark-mode',
  },
})
</script>
<template>
  <ApiReferenceLayout
    :configuration="configuration"
    :parsedSpec="parsedSpec"
    :rawSpec="rawSpec">
  </ApiReferenceLayout>
  <!-- <ModernLayout -->
  <!--   :configuration="configuration" -->
  <!--   :parsedSpec="parsedSpec" -->
  <!--   :rawSpec="rawSpec"> -->
  <!-- </ModernLayout> -->
</template>
