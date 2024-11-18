<script setup lang="ts">
import type { TransformedOperation } from '@scalar/types/legacy'

import { useResponses } from '../../../hooks'
import ParameterList from './ParameterList.vue'

const props = defineProps<{ operation: TransformedOperation }>()

const { responses } = useResponses(props.operation)
</script>
<template>
  <ParameterList
    :collapsableItems="true"
    :parameters="responses">
    <template #title>Responses</template>
  </ParameterList>
</template>
