<script setup lang="ts">
import { CodeMirror } from '@scalar/use-codemirror'

import { useApiClientRequestStore } from '../../../stores/apiClientRequestStore'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

defineProps<{
  body?: string
  formData?: any[]
}>()

const { activeRequest, setActiveRequest } = useApiClientRequestStore()

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
    <CodeMirror
      v-else
      :content="activeRequest.body"
      :languages="['json']"
      line-numbers
      @change="updateActiveRequest" />
  </CollapsibleSection>
</template>
