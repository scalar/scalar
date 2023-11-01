<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { type ThemeId } from '@scalar/themes'
import { reactive } from 'vue'

import DevToolbar from '../components/DevToolbar.vue'
import MockFooter from '../components/MockFooter.vue'

// import preparsedContent from '../fixtures/specResult.json'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: true,
  spec: {
    // content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
    // content: () => {
    //   return { openapi: '3.1.0', info: { title: 'Example' }, paths: {} }
    // },
    // preparsedContent,
    // url: 'https://raw.githubusercontent.com/outline/openapi/main/spec3.json',
    // url: 'https://raw.githubusercontent.com/testimio/public-openapi/TES-14404-mobile-applications/api.yaml',
  },
  tabs: {
    initialContent: 'Swagger Editor',
  },
  // hocuspocusConfiguration: {
  //   name: 'document-1',
  //   token: 'secret',
  //   url: 'ws://localhost:1234',
  // },
})

// const spec = ref<string>(
//   JSON.stringify({ openapi: '3.1.0', info: { title: 'Example' }, paths: {} }),
// )

// watch(
//   spec,
//   () => {
//     Object.assign(configuration, {
//       ...configuration,
//       spec: {
//         content: spec.value,
//       },
//     })
//   },
//   // {
//   //   immediate: true,
//   // },
// )
</script>
<template>
  <!-- <textarea
    v-model="spec"
    cols="30"
    rows="10" /> -->
  <!-- <select
    @input="(event) => configuration.hocuspocusConfiguration ? configuration.hocuspocusConfiguration.name = (event.target as HTMLSelectElement).value : null"
    @value="configuration.hocuspocusConfiguration?.name">
    <option value="document-1">Document #1</option>
    <option value="document-2">Document #2</option>
    <option value="document-3">Document #3</option>
  </select> -->

  <ApiReference
    :configuration="configuration"
    @changeTheme="(theme: ThemeId) => (configuration.theme = theme)">
    <template #header>
      <DevToolbar v-model="configuration" />
    </template>
    <template #footer>
      <MockFooter />
    </template>
  </ApiReference>
</template>
