<script setup lang="ts">
import {
  ApiReference,
  type ReferenceConfiguration,
} from '@scalar/api-reference'
import { reactive } from 'vue'

import content from '../fixtures/petstorev3.json'

const configuration = reactive<ReferenceConfiguration>({
  theme: 'default',
  proxy: 'http://localhost:5051',
  isEditable: false,
  layout: 'classic',
  spec: { content },
})
</script>
<template>
  <ApiReference :configuration="configuration" />
</template>
