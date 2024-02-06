<script lang="ts" setup>
import { CodeMirror } from '@scalar/use-codemirror'
import { watch } from 'vue'

import { prettyPrintJson } from '../../../../helpers'

const props = defineProps<{
  response:
    | undefined
    | {
        examples?: Record<string, any>
        example?: any
        schema?: any
      }
}>()

watch(
  () => props.response?.schema,
  () => {
    console.log(props.response?.schema)
  },
)
</script>

<template>
  <CodeMirror
    v-if="response?.schema"
    :content="prettyPrintJson(response.schema)"
    :languages="['json']"
    readOnly />
</template>
