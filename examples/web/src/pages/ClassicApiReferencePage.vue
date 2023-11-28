<script setup lang="ts">
import {
  ApiReferenceClassic,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: false,
  spec: {
    url: 'https://petstore.swagger.io/v2/swagger.json',
  },
  showSidebar: false,
  tabs: {
    initialContent: 'Swagger Editor',
  },
})
</script>
<template>
  <ApiReferenceClassic :configuration="configuration" />
</template>
