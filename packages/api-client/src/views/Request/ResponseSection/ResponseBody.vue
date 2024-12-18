<script lang="ts" setup>
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { extractFilename } from '@/libs/extractAttachmentFilename'
import { mediaTypes } from '@/views/Request/consts'
import { computed, ref } from 'vue'
import MIMEType from 'whatwg-mimetype'

import ResponseBodyDownload from './ResponseBodyDownload.vue'
import ResponseBodyInfo from './ResponseBodyInfo.vue'
import ResponseBodyPreview from './ResponseBodyPreview.vue'
import ResponseBodyRaw from './ResponseBodyRaw.vue'
import ResponseBodyToggle from './ResponseBodyToggle.vue'

const props = defineProps<{
  title: string
  data: unknown
  headers: { name: string; value: string; required: boolean }[]
}>()

/** Type guard to ensure blobs are blobs */
const isBlob = (b: any): b is Blob => b instanceof Blob

/** Preview / Raw toggle */
const toggle = ref(true)

const showToggle = computed(
  () => !!(mediaConfig.value?.raw && mediaConfig.value.preview),
)

const showPreview = computed(() => toggle.value || !showToggle.value)
const showRaw = computed(() => !toggle.value || !showToggle.value)

const mimeType = computed(() => {
  const contentType =
    props.headers.find((header) => header.name.toLowerCase() === 'content-type')
      ?.value ?? ''
  return new MIMEType(contentType)
})

const attachmentFilename = computed(() => {
  const value =
    props.headers.find(
      (header) => header.name.toLowerCase() === 'content-disposition',
    )?.value ?? ''
  return extractFilename(value)
})

const mediaConfig = computed(() => mediaTypes[mimeType.value.essence])

const dataUrl = computed<string>(() => {
  if (isBlob(props.data)) return URL.createObjectURL(props.data)
  if (typeof props.data === 'string')
    return URL.createObjectURL(
      new Blob([props.data], { type: mimeType.value.toString() }),
    )
  if (props.data instanceof Object && Object.keys(props.data).length)
    return URL.createObjectURL(
      new Blob([JSON.stringify(props.data)], {
        type: mimeType.value.toString(),
      }),
    )
  return ''
})
</script>
<template>
  <ViewLayoutCollapse class="max-h-content overflow-x-auto">
    <template #title>{{ title }}</template>
    <template
      v-if="data && dataUrl"
      #actions>
      <ResponseBodyDownload
        :filename="attachmentFilename"
        :href="dataUrl"
        :type="mimeType.essence" />
    </template>
    <div
      v-if="data"
      class="max-h-[calc(100%-32px)] border-t-1/2 flex flex-col bg-b-1 overflow-hidden">
      <div class="flex justify-between items-center border-b-1/2 px-3 py-1.5">
        <span class="text-xxs leading-3 font-code">
          {{ mimeType.essence }}
        </span>
        <ResponseBodyToggle
          v-if="showToggle"
          v-model="toggle" />
      </div>
      <ResponseBodyRaw
        v-if="mediaConfig?.raw && showRaw"
        :key="dataUrl"
        :content="data"
        :language="mediaConfig.language" />
      <ResponseBodyPreview
        v-if="mediaConfig?.preview && showPreview"
        :key="dataUrl"
        :alpha="mediaConfig.alpha"
        :mode="mediaConfig.preview"
        :src="dataUrl"
        :type="mimeType.essence" />
      <ResponseBodyInfo v-if="!mediaConfig?.raw && !mediaConfig?.preview">
        Binary file
      </ResponseBodyInfo>
    </div>
  </ViewLayoutCollapse>
</template>
<style scoped>
.scalar-code-block:deep(.hljs *) {
  font-size: var(--scalar-mini);
}
</style>
