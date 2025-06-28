<script setup lang="ts">
import { ScalarVirtualText } from '@scalar/components'
import { formatJsonOrYamlString } from '@scalar/oas-utils/helpers'
import { computed, toRef } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useResponseBody } from '@/hooks/useResponseBody'

import ResponseBodyDownload from './ResponseBodyDownload.vue'

const props = defineProps<{
  content: string
  data: unknown
  headers: { name: string; value: string; required: boolean }[]
}>()

const textContent = computed(() => formatJsonOrYamlString(props.content))

const { mimeType, attachmentFilename, dataUrl } = useResponseBody({
  data: toRef(props, 'data'),
  headers: toRef(props, 'headers'),
})
</script>

<template>
  <ViewLayoutCollapse class="!max-h-100% response-body-virtual overflow-x-auto">
    <template #title>Body</template>
    <template
      v-if="dataUrl"
      #actions>
      <ResponseBodyDownload
        :filename="attachmentFilename"
        :href="dataUrl"
        :type="mimeType.essence" />
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
