<script lang="ts" setup>
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useCodeSnippet } from '@/libs/code-snippets'
import { createRequestOperation } from '@/libs/send-request'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarCodeBlock } from '@scalar/components'
import '@scalar/oas-utils/entities/spec'
import { computed, ref } from 'vue'

const target = ref<string>('node')
const client = ref<string>('undici')

const workspaceContext = useWorkspace()

const {
  activeCollection,
  activeExample,
  activeEnvironment,
  activeRequest,
  activeWorkspace,
  activeServer,
} = useActiveEntities()

const { cookies, isReadOnly, securitySchemes, events } = workspaceContext

const selectedSecuritySchemeUids = computed(
  () =>
    (isReadOnly
      ? activeCollection.value?.selectedSecuritySchemeUids
      : activeRequest.value?.selectedSecuritySchemeUids) ?? [],
)

const request = computed(() => {
  if (!activeRequest.value || !activeExample.value || !activeCollection.value) {
    return undefined
  }

  // Parse the environment string
  const globalCookies = activeWorkspace.value.cookies.map((c) => cookies[c])

  const [_, preparedRequest] = createRequestOperation({
    request: activeRequest.value,
    example: activeExample.value,
    selectedSecuritySchemeUids: selectedSecuritySchemeUids.value,
    proxy: activeWorkspace.value.proxyUrl ?? '',
    environment: activeEnvironment.value?.value,
    globalCookies,
    status: events.requestStatus,
    securitySchemes: securitySchemes,
    server: activeServer.value,
  })

  return preparedRequest
})

const { codeSnippet } = useCodeSnippet({
  target,
  client,
  request,
})
</script>

<template>
  <template v-if="request">
    <ViewLayoutCollapse>
      <template #title>Code Snippet</template>
      <div class="border rounded">
        <ScalarCodeBlock
          :content="codeSnippet"
          :copy="true"
          :lang="target" />
      </div>
    </ViewLayoutCollapse>
  </template>
</template>
