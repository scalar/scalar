<script setup lang="ts">
import type { TransformedOperation } from '@scalar/types/legacy'

import { useResponses } from '../hooks/useResponses'
import ParameterList from './ParameterList.vue'

const props = withDefaults(
  defineProps<{
    operation: TransformedOperation
    collapsableItems?: boolean
  }>(),
  {
    collapsableItems: true,
  },
)

const { responses } = useResponses(props.operation)
</script>
<template>
  <ParameterList
    :collapsableItems="collapsableItems"
    :parameters="responses">
    <template #title>Responses</template>
  </ParameterList>

  <ParameterList
    class="endpoint-details-card-item"
    :parameters="responses">
    <template #title>Responses</template>
  </ParameterList>
</template>
