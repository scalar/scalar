<script lang="ts" setup>
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { mediaTypes } from '@/views/Request/consts'
import { computed, ref } from 'vue'

import ResponseBodyDownload from './ResponseBodyDownload.vue'
import ResponseBodyInfo from './ResponseBodyInfo.vue'
import ResponseBodyPreview from './ResponseBodyPreview.vue'
import ResponseBodyRaw from './ResponseBodyRaw.vue'
import ResponseBodyToggle from './ResponseBodyToggle.vue'

const props = defineProps<{
  title: string
  data: any
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

const contentType = computed(
  () =>
    props.headers.find((header) => header.name.toLowerCase() === 'content-type')
      ?.value ?? '',
)
const mimeType = computed(() => {
  if (isBlob(props.data)) return props.data.type
  else return contentType.value.split(';')[0]
})

const mediaConfig = computed(() => mediaTypes[mimeType.value])

const dataUrl = computed<string>(() => {
  if (isBlob(props.data)) return URL.createObjectURL(props.data)
  if (typeof props.data === 'string')
    return URL.createObjectURL(
      new Blob([props.data], { type: contentType.value }),
    )
  return ''
})
</script>
<template>
  <ViewLayoutCollapse>
    <template #title="{ open }">
      <span>{{ title }}</span>
      <ResponseBodyToggle
        v-if="showToggle && open"
        v-model="toggle" />
    </template>
    <template
      v-if="data && dataUrl"
      #actions>
      <ResponseBodyDownload
        :href="dataUrl"
        :type="mimeType" />
    </template>
    <div
      v-if="data"
      class="mx-1">
      <ResponseBodyRaw
        v-if="mediaConfig?.raw && showRaw"
        :key="dataUrl"
        :data="data"
        :language="mediaConfig.language" />
      <ResponseBodyPreview
        v-if="mediaConfig?.preview && showPreview"
        :key="dataUrl"
        :alpha="mediaConfig.alpha"
        :mode="mediaConfig.preview"
        :src="dataUrl"
        :type="mimeType" />
      <ResponseBodyInfo v-if="!mediaConfig?.raw && !mediaConfig?.preview">
        Binary file ({{ mimeType }})
      </ResponseBodyInfo>
    </div>
  </ViewLayoutCollapse>
</template>
