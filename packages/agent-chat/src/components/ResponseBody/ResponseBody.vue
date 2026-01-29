<script lang="ts" setup>
import { watch } from 'vue'
import type MIMEType from 'whatwg-mimetype'

import { type MediaConfig } from '@/components/ResponseBody/helpers/media-types'
import ResponseBodyInfo from '@/components/ResponseBody/ResponseBodyInfo.vue'
import ResponseBodyPreview from '@/components/ResponseBody/ResponseBodyPreview.vue'
import ResponseBodyRaw from '@/components/ResponseBody/ResponseBodyRaw.vue'

const { data, responseBody, mediaConfig, display } = defineProps<{
  data: unknown
  responseBody: {
    mimeType?: MIMEType
    attachmentFilename: string
    dataUrl: string
  }
  mediaConfig?: MediaConfig
  display?: 'preview' | 'raw'
}>()

watch(
  () => display,
  (v) => console.log(v),
)
</script>

<template>
  <ResponseBodyRaw
    v-if="mediaConfig?.raw && display === 'raw' && mediaConfig.language"
    :key="responseBody.dataUrl"
    :content="data"
    :language="mediaConfig.language" />
  <ResponseBodyPreview
    v-if="mediaConfig?.preview && display === 'preview'"
    :key="responseBody.dataUrl"
    :alpha="mediaConfig.alpha"
    :mode="mediaConfig.preview"
    :src="responseBody.dataUrl"
    :type="responseBody.mimeType?.essence ?? ''" />
  <ResponseBodyInfo v-if="!mediaConfig?.raw && !mediaConfig?.preview">
    Binary file
  </ResponseBodyInfo>
</template>
