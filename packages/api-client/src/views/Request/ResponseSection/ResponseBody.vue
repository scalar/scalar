<script lang="ts" setup>
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { mediaTypes } from '@/views/Request/consts'
import { ScalarIcon } from '@scalar/components'
import { computed, ref } from 'vue'

import ResponseBodyPreviewImage from './ResponseBodyPreviewImage.vue'
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
  if (!props.data) return ''
  const blob = new Blob([props.data], { type: contentType.value })
  return URL.createObjectURL(blob)
})
</script>
<template>
  <ViewLayoutCollapse>
    <template #title>
      <span>{{ title }}</span>
      <ResponseBodyToggle
        v-if="showToggle"
        v-model="toggle" />
    </template>
    <template
      v-if="data"
      #actions>
      <a
        class="flex gap-1 text-c-3 text-xxs no-underline items-center hover:bg-b-3 rounded py-0.5 px-1.5"
        download
        :href="dataUrl"
        @click.stop>
        <ScalarIcon
          icon="Download"
          size="xs" />
        <span>Download</span>
      </a>
    </template>
    <div
      v-if="data && mediaConfig"
      class="mx-1">
      <ResponseBodyRaw
        v-if="mediaConfig.raw && showRaw"
        :data="data"
        :language="mediaConfig.language" />
      <template v-if="showPreview && isBlob(data)">
        <ResponseBodyPreviewImage
          v-if="mediaConfig.preview?.startsWith('img')"
          :data="data"
          :transparent="mediaConfig.preview === 'img-w-alpha'" />
      </template>
    </div>
  </ViewLayoutCollapse>
</template>
