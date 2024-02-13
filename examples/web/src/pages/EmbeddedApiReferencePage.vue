<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

import SlotPlaceholder from '../components/SlotPlaceholder.vue'
import content from '../fixtures/petstorev3.json'

const configuration = reactive<ReferenceConfiguration>({
  proxy: import.meta.env.VITE_REQUEST_PROXY_URL,
  isEditable: false,
  spec: { content },
})
</script>
<template>
  <main class="main">
    <h1>This is my super duper web application</h1>
    <div class="container">
      <ApiReference :configuration="configuration">
        <template #footer><SlotPlaceholder>footer</SlotPlaceholder></template>
      </ApiReference>
    </div>
  </main>
</template>
<style scoped>
.main {
  display: flex;
  flex-direction: column;

  font-family: sans-serif;
  box-sizing: border-box;

  padding: 2rem;
  width: 100vw;
  height: 100vh;
}
.container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #000;
  border-radius: 3px;
}
</style>
