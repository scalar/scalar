<script lang="ts" setup>
import { type OpenAPIV2, type OpenAPIV3, type OpenAPIV3_1 } from 'openapi-types'

import SecurityScheme from './SecurityScheme.vue'

defineProps<{
  value: Record<
    string,
    | OpenAPIV2.SecuritySchemeObject
    | OpenAPIV3.SecuritySchemeObject
    | OpenAPIV3_1.SecuritySchemeObject
  >
}>()
</script>
<template>
  <SecurityScheme
    v-for="key in Object.keys(value)"
    :key="key"
    :value="value[key]" />
</template>
