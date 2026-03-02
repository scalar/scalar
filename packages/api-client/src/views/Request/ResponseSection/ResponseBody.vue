<script lang="ts" setup>
import { computed, ref, toRef } from 'vue'

import ViewLayoutCollapse from '@/components/ViewLayout/ViewLayoutCollapse.vue'
import { useResponseBody } from '@/hooks/useResponseBody'
import { getMediaTypeConfig } from '@/views/Request/consts'

import ResponseBodyDownload from './ResponseBodyDownload.vue'
import ResponseBodyInfo from './ResponseBodyInfo.vue'
import ResponseBodyPreview from './ResponseBodyPreview.vue'
import ResponseBodyRaw from './ResponseBodyRaw.vue'
import ResponseBodyToggle from './ResponseBodyToggle.vue'

const props = defineProps<{
  title: string
  layout: 'client' | 'reference'
  data: unknown
  headers: { name: string; value: string; required: boolean }[]
}>()

/** Preview / Raw toggle */
const toggle = ref(true)

const showToggle = computed(
  () => !!(mediaConfig.value?.raw && mediaConfig.value.preview),
)

const showPreview = computed(() => toggle.value || !showToggle.value)
const showRaw = computed(() => !toggle.value || !showToggle.value)

const { mimeType, attachmentFilename, dataUrl } = useResponseBody({
  data: toRef(props, 'data'),
  headers: toRef(props, 'headers'),
})

const mediaConfig = computed(() => getMediaTypeConfig(mimeType.value.essence))
</script>
<template>
  <ViewLayoutCollapse
    class="max-h-content overflow-y-hidden"
    :layout="layout">
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
      class="bg-b-1 flex max-h-[calc(100%-32px)] flex-col overflow-hidden">
      <div
        class="box-content flex min-h-8 items-center justify-between border-y px-3">
        <span class="text-xxs font-code leading-3">
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
  font-size: var(--scalar-small);
}
</style>
