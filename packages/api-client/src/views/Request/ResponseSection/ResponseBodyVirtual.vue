<script setup lang="ts">
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useResponseBody } from '@/hooks/useResponseBody'
import { ScalarVirtualText } from '@scalar/components'
import { formatJsonOrYamlString } from '@scalar/oas-utils/helpers'
import { computed } from 'vue'

import ResponseBodyDownload from './ResponseBodyDownload.vue'

const props = defineProps<{
  content: string
  data: unknown
  headers: { name: string; value: string; required: boolean }[]
}>()

const textContent = computed(() => formatJsonOrYamlString(props.content))

const { mimeType, attachmentFilename, dataUrl } = useResponseBody({
  data: props.data,
  headers: props.headers,
})
</script>

<template>
  <ViewLayoutCollapse class="!max-h-100% overflow-x-auto response-body-virtual">
    <template #title>Body</template>
    <template
      v-if="dataUrl"
      #actions>
      <ResponseBodyDownload
        :filename="attachmentFilename"
        :href="dataUrl"
        :type="mimeType.essence" />
    </template>
    <div
      class="py-1.5 px-2.5 font-code text-xxs border-1/2 rounded-t border-b-0">
      This response body is massive! Syntax highlighting won’t work here.
    </div>
    <ScalarVirtualText
      containerClass="custom-scroll scalar-code-block border-1/2 rounded-b flex flex-1 max-h-screen"
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
