<script setup lang="ts">
import { CodeMirror } from '../../CodeMirror'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

defineProps<{
  body?: string
  formData?: any[]
  requestBody?: any
}>()
</script>
<template>
  <CollapsibleSection title="Body">
    <template
      v-if="body && body.length === 0 && formData && formData.length === 0">
      <span>No Body</span>
    </template>
    <template v-else-if="formData && formData.length > 0">
      <Grid :items="formData" />
    </template>
    <CodeMirror
      v-else
      :content="
        requestBody?.content?.active.examples.default
          ? JSON.stringify(
              requestBody?.content?.active.examples.default,
              null,
              2,
            )
          : '{}'
      "
      :languages="['json']"
      :lineNumbers="true" />
  </CollapsibleSection>
</template>
