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
  searchHotKey: 'l',
  // spec: {
  //   preparsedContent,
  // },
  tabs: {
    initialContent: 'Swagger Editor',
  },
})
</script>

<template>
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
