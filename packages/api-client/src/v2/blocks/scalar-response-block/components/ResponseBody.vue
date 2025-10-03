<script lang="ts" setup>
import { computed, ref } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { processResponseBody } from '@/v2/blocks/scalar-response-block/helpers/process-response-body'

import { getMediaTypeConfig } from './../helpers/media-types'
import ResponseBodyDownload from './ResponseBodyDownload.vue'
import ResponseBodyInfo from './ResponseBodyInfo.vue'
import ResponseBodyPreview from './ResponseBodyPreview.vue'
import ResponseBodyRaw from './ResponseBodyRaw.vue'
import ResponseBodyToggle from './ResponseBodyToggle.vue'

const { data, headers } = defineProps<{
  title: string
  layout: 'client' | 'reference'
  data: unknown
  headers: { name: string; value: string }[]
}>()

/** Preview / Raw toggle */
const toggle = ref(true)

const showToggle = computed(
  () => !!(mediaConfig.value?.raw && mediaConfig.value.preview),
)

const showPreview = computed(() => toggle.value || !showToggle.value)
const showRaw = computed(() => !toggle.value || !showToggle.value)

const responseBody = computed(() =>
  processResponseBody({
    data,
    headers,
  }),
)

const mediaConfig = computed(() =>
  getMediaTypeConfig(responseBody.value.mimeType?.essence ?? ''),
)
</script>
<template>
  <ViewLayoutCollapse
    class="max-h-content overflow-y-hidden"
    :layout="layout">
    <template #title>{{ title }}</template>
    <template
      v-if="data && responseBody.dataUrl"
      #actions>
      <ResponseBodyDownload
        :filename="responseBody.attachmentFilename"
        :href="responseBody.dataUrl"
        :type="responseBody.mimeType?.essence" />
    </template>
    <div
      v-if="data"
      class="bg-b-1 flex max-h-[calc(100%-32px)] flex-col overflow-hidden">
      <div
        class="box-content flex min-h-8 items-center justify-between border-y px-3">
        <span class="text-xxs font-code leading-3">
          {{ responseBody.mimeType?.essence }}
        </span>
        <ResponseBodyToggle
          v-if="showToggle"
          v-model="toggle" />
      </div>
      <ResponseBodyRaw
        v-if="mediaConfig?.raw && showRaw"
        :key="responseBody.dataUrl"
        :content="data"
        :language="mediaConfig.language" />
      <ResponseBodyPreview
        v-if="mediaConfig?.preview && showPreview"
        :key="responseBody.dataUrl"
        :alpha="mediaConfig.alpha"
        :mode="mediaConfig.preview"
        :src="responseBody.dataUrl"
        :type="responseBody.mimeType?.essence ?? ''" />
      <ResponseBodyInfo v-if="!mediaConfig?.raw && !mediaConfig?.preview">
        Binary file
      </ResponseBodyInfo>
    </div>
  </ViewLayoutCollapse>
</template>
<style scoped>
.scalar-code-block:deep(.hljs *) {
  font-size: var(--scalar-small);
}
</style>
