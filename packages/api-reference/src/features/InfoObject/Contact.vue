<script setup lang="ts">
import { type OpenAPIV3_1 } from '@scalar/openapi-types'

defineProps<{
  value?: OpenAPIV3_1.ContactObject
}>()
</script>

<template>
  <template v-if="value">
    <div class="flex gap-1">
      <a :href="`mailto:${value?.email}`">{{ value.name }}</a>
    </div>
  </template>
</template>
