<script setup lang="ts">
import CodeInput from '@/components/CodeInput/CodeInput.vue'
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useWorkspace } from '@/store/workspace'

const { activeExample, requestExampleMutators } = useWorkspace()

function updateExamplePreRequestScript(content: string) {
  requestExampleMutators.edit(activeExample.value.uid, 'preSendScript', content)
}

function updateExamplePostRequestScript(content: string) {
  requestExampleMutators.edit(
    activeExample.value.uid,
    'postSendScript',
    content,
  )
}
</script>
<template>
  <ViewLayoutCollapse>
    <template #title>Scripts</template>
    <div>
      <div>
        <h2>Pre Request</h2>
        <CodeInput
          content=""
          language="javascript"
          lineNumbers
          :modelValue="activeExample?.preSendScript ?? ''"
          @update:modelValue="updateExamplePreRequestScript" />
      </div>
      <div>
        <h2>Post Request</h2>
        <CodeInput
          content=""
          language="javascript"
          lineNumbers
          :modelValue="activeExample?.postSendScript ?? ''"
          @update:modelValue="updateExamplePostRequestScript" />
      </div>
    </div>
  </ViewLayoutCollapse>
</template>
