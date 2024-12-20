<script setup lang="ts">
import type { Request as RequestEntity } from '@scalar/oas-utils/entities/spec'

import ParameterList from './ParameterList.vue'

withDefaults(
  defineProps<{
    responses: RequestEntity['responses']
    collapsableItems?: boolean
  }>(),
  {
    collapsableItems: true,
  },
)
</script>
<template>
  <ParameterList
    :collapsableItems="collapsableItems"
    :parameters="responses"
    :withExamples="false">
    <template #title>Responses</template>
  </ParameterList>
</template>
