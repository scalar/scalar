<script lang="ts" setup>
import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
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
  else return contentType.value
})

const codeLanguage = computed(() => {
  if (contentType.value.includes('json')) return 'json'
  if (contentType.value.includes('html')) return 'html'
  return 'html'
})

const dataUrl = computed<string>(() => {
  if (!props.data) return ''
  const blob = new Blob([props.data], { type: contentType.value })
  return URL.createObjectURL(blob)
})

const stringData = computed(() =>
  typeof props.data === 'string' ? props.data : '',
)
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
    {{ mimeType }}{{ data }}
    <ResponseBodyRaw
      :data="stringData"
      :language="codeLanguage" />
  </ViewLayoutCollapse>
</template>
