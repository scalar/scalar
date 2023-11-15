<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: true,

  tabs: {
    initialContent: 'Swagger Editor',
  },
})
</script>

<template>
  <ApiReference :configuration="configuration" />
</template>
