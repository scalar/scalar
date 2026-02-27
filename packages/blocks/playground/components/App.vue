<script setup lang="ts">
import '@scalar/themes/style.css'
import '@scalar/components/style.css'
import '@scalar/themes/tailwind.css'

import OperationCodeSample from '../../src/operation-code-sample/components/OperationCodeSample.vue'

const operation = {
  'method': 'GET',
  'path': '/api/v1/users',
  'parameters': [
    {
      name: 'id',
      in: 'path',
      required: true,
    },
  ],
  'responses': {
    '200': {
      description: 'Success',
    },
  },
  'tags': ['users'],
  'x-custom-examples': [
    {
      lang: 'javascript',
      source: 'console.log("Hello, world!");',
    },
  ],
}
</script>

<template>
  <div class="block">
    <div class="scalar-app">
      <OperationCodeSample
        :clientOptions="[]"
        :operation />
    </div>
  </div>
</template>
<style scoped>
.block {
  padding: 1rem;
}
</style>
