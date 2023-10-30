<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { type ThemeId } from '@scalar/themes'
import { reactive } from 'vue'

// import preparsedContent from '../fixtures/specResult.json'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: true,
  // spec: {
  //   preparsedContent,
  // },
  spec: {
    // content: { openapi: '3.1.0', info: { title: 'Example' }, paths: {} },
    // content: () => {
    //   return { openapi: '3.1.0', info: { title: 'Example' }, paths: {} }
    // },
    // preparsedContent,
    url: 'https://raw.githubusercontent.com/outline/openapi/main/spec3.json',
    // url: 'https://raw.githubusercontent.com/testimio/public-openapi/TES-14404-mobile-applications/api.yaml',
  },
  tabs: {
    initialContent: 'Swagger Editor',
  },
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
  <!-- <div>
    <input
      v-model="configuration.isEditable"
      type="checkbox" />
    isEditable
  </div>
  <div>
    <select v-model="configuration.theme">
      <option value="default">Default</option>
      <option value="purple">Purple</option>
      <option value="moon">Moon</option>
    </select>
  </div> -->
  <ApiReference
    :configuration="configuration"
    @changeTheme="(theme: ThemeId) => (configuration.theme = theme)" />
</template>
