<script lang="ts" setup>
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import {
  convertFetchOptionsToHarRequest,
  createRequestOperation,
} from '@/libs/send-request'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarCodeBlock } from '@scalar/components'
import '@scalar/oas-utils/entities/spec'
import { safeJSON } from '@scalar/object-utils/parse'
import { type ClientId, type TargetId, snippetz } from '@scalar/snippetz'
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
  const e = safeJSON.parse(activeEnvironment.value?.value || '{}')
  const environment =
    e.error || typeof e.data !== 'object' ? {} : (e.data ?? {})

  const globalCookies = activeWorkspace.value.cookies.map((c) => cookies[c])

  const [_, preparedRequest] = createRequestOperation({
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
    target.value,
    client.value,
    request.value?.createUrl(),
    request.value?.createFetchOptions(),
  )
})

/**
 * Create the code example for a request
 */
function createCodeSnippet(
  targetId: string,
  clientId: string,
  url?: string,
  fetchOptions?: RequestInit,
) {
  if (!url) {
    return ''
  }

  if (!snippetz().hasPlugin(targetId, clientId)) {
    return ''
  }

  const harRequest = convertFetchOptionsToHarRequest(url, fetchOptions)

  return snippetz().print(
    targetId as TargetId,
    clientId as ClientId,
    harRequest,
  )
}
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
