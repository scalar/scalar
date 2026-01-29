<script setup lang="ts">
import { ScalarLoading, useLoadingState } from '@scalar/components'
import { ScalarIconCheck, ScalarIconXCircle } from '@scalar/icons'

import { type UploadTmpDocumentState } from '@/hooks/use-upload-tmp-document'

const { uploadState } = defineProps<{
  uploadState: UploadTmpDocumentState
}>()

const loadingState = useLoadingState()
</script>

<template>
  <div
    class="uploadSection"
    :class="{
      error: uploadState.type === 'error',
      done: uploadState.type === 'done',
    }">
    <div
      class="flex items-center gap-1.5"
      v-if="
        uploadState.type === 'uploading' || uploadState.type === 'processing'
      ">
      <ScalarLoading
        class="text-blue"
        :loader="{
          ...loadingState,
          isLoading: true,
        }"
        size="lg" />
      <strong
        v-if="uploadState.type === 'processing'"
        class="uploadText">
        Processing document...
      </strong>
      <strong
        v-else
        class="uploadText">
        Uploading document...
      </strong>
    </div>
    <strong
      v-if="uploadState.type === 'done'"
      class="uploadText flex items-center gap-1.5">
      <ScalarIconCheck class="icon text-green" />
      Document processed
    </strong>
    <strong
      v-if="uploadState.type === 'error'"
      class="uploadText flex items-center gap-1.5">
      <ScalarIconXCircle class="icon text-red" />
      {{ uploadState.error }}
    </strong>
  </div>
</template>

<style scoped>
.uploadSection {
  width: 100%;
  margin-bottom: -16px;
  padding: 8px 8px 24px 12px;
  position: relative;
  background: color-mix(
    in srgb,
    var(--scalar-color-blue),
    var(--scalar-background-1) 95%
  );
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: absolute;
  top: 0;
  transform: translate3d(0, calc(-100% + 16px), 0);
}

.uploadSection.error {
  background: color-mix(
    in srgb,
    var(--scalar-color-red),
    var(--scalar-background-1) 95%
  );
}

.uploadSection.done {
  background: color-mix(
    in srgb,
    var(--scalar-color-green),
    var(--scalar-background-1) 95%
  );
}

.uploadText {
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
}

.icon {
  height: 20px;
  width: 20px;
}
</style>
