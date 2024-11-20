<script lang="ts" setup>
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useCodeSnippet } from '@/libs/code-snippets'
import { createRequestOperation } from '@/libs/send-request'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'
import { ScalarCodeBlock } from '@scalar/components'
import '@scalar/oas-utils/entities/spec'
import { snippetz } from '@scalar/snippetz'
import { computed, reactive, toRef } from 'vue'

const library = reactive({
  target: 'node',
  client: 'undici',
})

const {
  activeCollection,
  activeExample,
  activeEnvironment,
  activeRequest,
  activeWorkspace,
  activeServer,
} = useActiveEntities()

const { cookies, isReadOnly, securitySchemes, events } = useWorkspace()

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

  const [, preparedRequest] = createRequestOperation({
    request: activeRequest.value,
    example: activeExample.value,
    selectedSecuritySchemeUids: selectedSecuritySchemeUids.value,
    proxy: activeWorkspace.value.proxyUrl ?? '',
    environment: activeEnvironment.value?.value,
    globalCookies: activeWorkspace.value.cookies.map((c) => cookies[c]),
    status: events.requestStatus,
    securitySchemes: securitySchemes,
    server: activeServer.value,
  })

  return preparedRequest
})

const { codeSnippet } = useCodeSnippet({
  target: toRef(library, 'target'),
  client: toRef(library, 'client'),
  request,
})
</script>

<template>
  <template v-if="request">
    <ViewLayoutCollapse>
      <template #title>Code Snippet</template>

      <select
        class="my-2 p-1"
        :value="
          JSON.stringify({ target: library.target, client: library.client })
        "
        @change="
          (e) => {
            const value = JSON.parse((e.target as HTMLSelectElement).value)

            library.target = value.target
            library.client = value.client
          }
        ">
        >
        <option
          v-for="plugin in snippetz().plugins()"
          :key="JSON.stringify(plugin)"
          :value="JSON.stringify(plugin)">
          {{ plugin.target }} {{ plugin.client }}
        </option>
      </select>

      <div class="border rounded">
        <ScalarCodeBlock
          :content="codeSnippet"
          :copy="true"
          :lang="library.target" />
      </div>
    </ViewLayoutCollapse>
  </template>
</template>
