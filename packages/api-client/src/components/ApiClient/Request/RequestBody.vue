<script setup lang="ts">
import { CodeMirror } from '@scalar/use-codemirror'

import { useRequestStore } from '../../../stores'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

defineProps<{
  body?: string
  formData?: any[]
}>()

const { activeRequest, setActiveRequest } = useRequestStore()

const updateActiveRequest = (value: string) => {
  if (activeRequest.body !== value) {
    setActiveRequest({
      ...activeRequest,
      body: value,
    })
  }
}
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
    <template v-else>
      <CodeMirror
        :content="activeRequest.body"
        language="json"
        lineNumbers
        @change="updateActiveRequest" />
    </template>
  </CollapsibleSection>
</template>
