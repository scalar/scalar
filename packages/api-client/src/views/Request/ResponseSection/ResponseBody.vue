<script lang="ts" setup>
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { mediaTypes } from '@/views/Request/consts'
import { computed } from 'vue'

import ResponseBodyRaw from './ResponseBodyRaw.vue'

const props = defineProps<{
  title: string
  data?: Blob | string
  headers: { name: string; value: string; required: boolean }[]
}>()

const contentType = computed(
  () =>
    props.headers.find((header) => header.name.toLowerCase() === 'content-type')
      ?.value ?? '',
)
const mimeType = computed(() => {
  if (props.data instanceof Blob) return props.data.type
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
    <template #title>{{ title }}</template>
    <template #actions>
      <a
        download
        :href="dataUrl"
        @click.stop>
        Download
      </a>
    </template>
    {{ mimeType }}
    <ResponseBodyRaw
      v-if="props.data && mediaConfig?.raw"
      :data="props.data"
      :language="mediaConfig.language" />
  </ViewLayoutCollapse>
</template>
