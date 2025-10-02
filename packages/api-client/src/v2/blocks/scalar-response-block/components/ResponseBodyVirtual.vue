<script setup lang="ts">
import { ScalarVirtualText } from '@scalar/components'
import { formatJsonOrYamlString } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { processResponseBody } from '@/v2/blocks/scalar-response-block/helpers/process-response-body'

import ResponseBodyDownload from './ResponseBodyDownload.vue'

const { content, data, headers } = defineProps<{
  content: string
  data: unknown
  headers: { name: string; value: string }[]
}>()

const textContent = computed(() => formatJsonOrYamlString(content))

const responseBody = computed(() =>
  processResponseBody({
    data,
    headers,
  }),
)
</script>

<template>
  <ViewLayoutCollapse class="!max-h-100% response-body-virtual overflow-x-auto">
    <template #title>Body</template>
    <template
      v-if="responseBody.dataUrl"
      #actions>
      <ResponseBodyDownload
        :filename="responseBody.attachmentFilename"
        :href="responseBody.dataUrl"
        :type="responseBody.mimeType.essence" />
    </template>
    <div class="font-code text-xxs rounded-t border border-b-0 px-2.5 py-1.5">
      This response body is massive! Syntax highlighting won't work here.
    </div>
    <ScalarVirtualText
      containerClass="custom-scroll scalar-code-block border rounded-b flex flex-1 max-h-screen"
      contentClass="language-plaintext whitespace-pre font-code text-base"
      :lineHeight="20"
      :text="textContent" />
  </ViewLayoutCollapse>
</template>

<style>
.response-body-virtual[data-headlessui-state='open'],
.response-body-virtual[data-headlessui-state='open'] .diclosure-panel {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
</style>
