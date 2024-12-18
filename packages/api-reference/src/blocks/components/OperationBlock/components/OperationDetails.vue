<script lang="ts" setup>
import type { Request } from '@scalar/oas-utils/entities/spec'

defineProps<{
  operation: Request
}>()
</script>

<template>
  <h1 class="font-bold">{{ operation.method }} {{ operation.path }}</h1>
  <p>
    {{ operation.description }}
  </p>
</template>
