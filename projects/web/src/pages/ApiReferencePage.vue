<script setup lang="ts">
import { ApiReference } from '@scalar/api-reference'
import { type ThemeId } from '@scalar/themes'
import { ref } from 'vue'

const activeTheme = ref<ThemeId>('default')

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

// import specResult from '../fixtures/specResult.json'
</script>

<template>
  <ApiReference
    :initialTabState="'Swagger Editor'"
    :isEditable="true"
    proxyUrl="http://localhost:5051"
    :theme="activeTheme"
    @changeTheme="activeTheme = $event" />
  <!-- <ApiReference isEditable theme="moon" /> -->
  <!-- <ApiReference :specUrl="/swagger.json" /> -->
  <!-- <ApiReference :spec="{ … }" /> -->
  <!-- <ApiReference :specResult="specResult" /> -->
</template>
