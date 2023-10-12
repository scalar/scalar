<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

/**
 * Let’s imagine how the configuration could look like.
 */
//  const exampleConfiguration = {
//   theme: 'purple',
//   spec: {
//     content: fastify.swagger(),
//   },
//   proxy: 'https://api.scalar.com/request-proxy',
//   isEditable: true,
//   tabs: {
//     enabled: true,
//     initialContent: 'Getting Started',
//   },
//   showSidebar: true,
//   footerBelowSidebar: true,
//   doNotPromoteScalar: true,
// }

/**
 * Usage:
 * ```vue
 * <ApiReference :config="exampleConfiguration" />
 * ```
 */

const configuration: ReferenceConfiguration = reactive({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: true,
  tabs: {
    initialContent: 'Editor',
  },
})

// import specResult from '../fixtures/specResult.json'
</script>

<template>
  <div>
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
  </div>
  <ApiReference
    :configuration="configuration"
    @changeTheme="(theme) => (configuration.theme = theme)" />
  <!-- <ApiReference
    :initialTabState="'Swagger Editor'"
    :isEditable="true"
    proxyUrl="http://localhost:5051"
    :theme="activeTheme"
    @changeTheme="activeTheme = $event" /> -->
  <!-- <ApiReference isEditable theme="moon" /> -->
  <!-- <ApiReference :specUrl="/swagger.json" /> -->
  <!-- <ApiReference :spec="{ … }" /> -->
  <!-- <ApiReference :specResult="specResult" /> -->
</template>
