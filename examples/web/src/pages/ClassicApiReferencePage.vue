<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: false,
  layout: 'classic',
  spec: {
    url: 'https://petstore3.swagger.io/api/v3/openapi.json',
  },
})
</script>
<template>
  <ApiReference :configuration="configuration" />
</template>
