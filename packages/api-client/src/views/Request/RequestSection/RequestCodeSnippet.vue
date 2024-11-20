<script lang="ts" setup>
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import {
  convertFetchOptionsToHarRequest,
  createRequestOperation,
} from '@/libs/send-request'
import { useWorkspace } from '@/store'
import { ScalarCodeBlock } from '@scalar/components'
import '@scalar/oas-utils/entities/spec'
import { safeJSON } from '@scalar/object-utils/parse'
import { snippetz } from '@scalar/snippetz'
import { computed } from 'vue'

const workspaceContext = useWorkspace()

const {
  activeCollection,
  activeExample,
  activeEnvironment,
  activeRequest,
  activeWorkspace,
  activeServer,
  cookies,
  isReadOnly,
  securitySchemes,
  events,
} = workspaceContext

const selectedSecuritySchemeUids = computed(
  () =>
    (isReadOnly.value
      ? activeCollection.value?.selectedSecuritySchemeUids
      : activeRequest.value?.selectedSecuritySchemeUids) ?? [],
)

const request = computed(() => {
  if (!activeRequest.value || !activeExample.value || !activeCollection.value) {
    return undefined
  }

  // Parse the environment string
  const e = safeJSON.parse(activeEnvironment.value?.value || '{}')
  const environment =
    e.error || typeof e.data !== 'object' ? {} : (e.data ?? {})

  const globalCookies = activeWorkspace.value.cookies.map((c) => cookies[c])

  const [_, preparedRequest] = createRequestOperation({
    auth: activeCollection.value.auth,
    request: activeRequest.value,
    example: activeExample.value,
    selectedSecuritySchemeUids: selectedSecuritySchemeUids.value,
    proxy: activeWorkspace.value.proxyUrl ?? '',
    environment,
    globalCookies,
    status: events.requestStatus,
    securitySchemes: securitySchemes,
    server: activeServer.value,
  })

  return preparedRequest
})

const codeSnippet = computed(() => {
  return createCodeSnippet(
    'node',
    'fetch',
    request.value?.createUrl(),
    request.value?.createFetchOptions(),
  )
})

/**
 * Create the code example for a request
 */
function createCodeSnippet(
  target: string,
  client: string,
  url?: string,
  fetchOptions?: RequestInit,
) {
  if (!url) {
    return ''
  }

  if (!snippetz().hasPlugin(target, client)) {
    return ''
  }

  const harRequest = convertFetchOptionsToHarRequest(url, fetchOptions)

  return snippetz().print(target, client, harRequest)
}
</script>

<template>
  <template v-if="request">
    <ViewLayoutCollapse>
      <template #title>Code Snippet</template>
      <div class="border">
        <ScalarCodeBlock
          :content="codeSnippet"
          lang="js" />
      </div>
    </ViewLayoutCollapse>
  </template>
</template>
