<script lang="ts" setup>
import type { ClientPlugin } from '@scalar/oas-utils/helpers'
import type { CodeMirrorLanguage } from '@scalar/use-codemirror'
import { computed, ref } from 'vue'

import { getMediaTypeConfig } from '@/v2/blocks/response-block/helpers/media-types'
import { processResponseBody } from '@/v2/blocks/response-block/helpers/process-response-body'
import { resolveResponseBodyHandler } from '@/v2/blocks/response-block/helpers/resolve-response-body-handler'
import { CollapsibleSection } from '@/v2/components/layout'

import ResponseBodyDownload from './ResponseBodyDownload.vue'
import ResponseBodyInfo from './ResponseBodyInfo.vue'
import ResponseBodyPreview from './ResponseBodyPreview.vue'
import ResponseBodyRaw from './ResponseBodyRaw.vue'
import ResponseBodyToggle from './ResponseBodyToggle.vue'

const {
  data,
  headers,
  plugins = [],
} = defineProps<{
  title: string
  layout: 'client' | 'reference'
  data: unknown
  headers: { name: string; value: string }[]
  plugins?: ClientPlugin[]
}>()

/** Preview / Raw toggle */
const toggle = ref(true)

const responseBody = computed(() =>
  processResponseBody({
    data,
    headers,
  }),
)

const mimeEssence = computed(() => responseBody.value.mimeType?.essence ?? '')

const mediaConfig = computed(() => getMediaTypeConfig(mimeEssence.value))

const pluginHandler = computed(() =>
  resolveResponseBodyHandler(mimeEssence.value, plugins),
)

const hasRaw = computed(
  () =>
    !!pluginHandler.value?.rawComponent ||
    !!pluginHandler.value?.decode ||
    !!mediaConfig.value?.raw,
)

const hasPreview = computed(
  () => !!pluginHandler.value?.previewComponent || !!mediaConfig.value?.preview,
)

const showToggle = computed(() => hasRaw.value && hasPreview.value)

const showPreview = computed(() => toggle.value || !showToggle.value)
const showRaw = computed(() => !toggle.value || !showToggle.value)

const rawLanguage = computed(
  () => pluginHandler.value?.language ?? mediaConfig.value?.language,
)
</script>
<template>
  <CollapsibleSection
    class="max-h-content overflow-y-hidden"
    :isStatic="layout === 'reference'">
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
        <span class="text-xxs font-code leading-5">
          {{ mimeEssence }}
        </span>
        <ResponseBodyToggle
          v-if="showToggle"
          v-model="toggle" />
      </div>

      <!-- Plugin custom raw component -->
      <component
        :is="pluginHandler.rawComponent"
        v-if="pluginHandler?.rawComponent && hasRaw && showRaw"
        :key="`plugin-raw-${responseBody.dataUrl}`"
        :content="data"
        :contentType="mimeEssence" />
      <!-- Default raw renderer (used when plugin provides decode but no custom component) -->
      <ResponseBodyRaw
        v-else-if="hasRaw && showRaw"
        :key="`raw-${responseBody.dataUrl}`"
        :content="data"
        :language="rawLanguage as CodeMirrorLanguage" />

      <!-- Plugin custom preview component -->
      <component
        :is="pluginHandler.previewComponent"
        v-if="pluginHandler?.previewComponent && hasPreview && showPreview"
        :key="`plugin-preview-${responseBody.dataUrl}`"
        :content="data"
        :contentType="mimeEssence"
        :dataUrl="responseBody.dataUrl" />
      <!-- Default preview renderer -->
      <ResponseBodyPreview
        v-else-if="mediaConfig?.preview && showPreview"
        :key="`preview-${responseBody.dataUrl}`"
        :alpha="mediaConfig.alpha"
        :mode="mediaConfig.preview"
        :src="responseBody.dataUrl"
        :type="mimeEssence" />

      <ResponseBodyInfo v-if="!hasRaw && !hasPreview">
        Binary file
      </ResponseBodyInfo>
    </div>
  </CollapsibleSection>
</template>
<style scoped>
.scalar-code-block :deep(.hljs *) {
  font-size: var(--scalar-small);
}
</style>
