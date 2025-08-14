<script setup lang="ts">
import { inject, type Ref } from 'vue'

import { Badge } from '@/components/Badge'
import { OPENAPI_VERSION_SYMBOL } from '@/features/download-links'

/**
 * Get the OpenAPI/Swagger specification version from the API definition.
 */
const oasVersion = inject<Ref<string | undefined>>(OPENAPI_VERSION_SYMBOL)
</script>
<template>
  <Badge v-if="oasVersion">OAS {{ oasVersion }}</Badge>
</template>
