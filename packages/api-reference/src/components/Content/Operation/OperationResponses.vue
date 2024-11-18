<script setup lang="ts">
import type { TransformedOperation } from '@scalar/types/legacy'

import { useResponses } from '../../../hooks'
import Parameters from './Parameters.vue'

const props = defineProps<{ operation: TransformedOperation }>()

const { responses } = useResponses(props.operation)
</script>
<template>
  <Parameters
    :collapsableItems="true"
    :parameters="responses">
    <template #title>Responses</template>
  </Parameters>
</template>
