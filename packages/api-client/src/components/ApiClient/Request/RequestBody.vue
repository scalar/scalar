<script setup lang="ts">
import { useApiClientRequestStore } from '../../../stores/apiClientRequestStore'
import { CodeMirror } from '../../CodeMirror'
import { CollapsibleSection } from '../../CollapsibleSection'
import { Grid } from '../../Grid'

const { activeRequest, setActiveRequest } = useApiClientRequestStore()

defineProps<{
  body?: string
  formData?: any[]
  requestBody?: any
}>()

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
      :lineNumbers="true"
      @change="updateActiveRequest" />
  </CollapsibleSection>
</template>
