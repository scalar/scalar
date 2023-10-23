<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { type ThemeId } from '@scalar/themes'
import { reactive } from 'vue'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: true,
  tabs: {
    initialContent: 'Swagger Editor',
  },
})
// import specResult from '../fixtures/specResult.json'
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
