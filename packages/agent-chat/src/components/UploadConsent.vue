<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarModal, useModal } from '@scalar/components/modal'
import { isObject } from '@scalar/helpers/object/is-object'
import { safeRun } from '@scalar/helpers/types/safe-run'
import { ScalarIconFileText } from '@scalar/icons'
import { computed, watch } from 'vue'

import { useState } from '@/state/state'

const { uploadConsent, uploadState, terms, mode } = useState()
const modal = useModal()
const confirm = (): void => {
  if (mode === 'preview') {
    terms.accept()
  }
  uploadConsent.respond(true)
}
const info = computed(() => {
  const result = safeRun<unknown>(() =>
    JSON.parse(uploadConsent.document.value),
  )
  const data =
    result.ok && isObject(result.data) && isObject(result.data.info)
      ? result.data.info
      : {}
  return {
    title:
      typeof data.title === 'string' && data.title
        ? data.title
        : 'API description',
    version: typeof data.version === 'string' ? data.version : '',
  }
})

watch(
  () => uploadState.value?.type === 'awaiting-consent',
  (pending) => (pending ? modal.show() : modal.hide()),
  { immediate: true },
)
</script>

<template>
  <ScalarModal
    bodyClass="p-5 pt-4 overflow-y-auto"
    class="[&_.scalar-modal-header]:px-5 [&_.scalar-modal-header]:pt-5 [&_.scalar-modal-header]:text-lg"
    size="xs"
    :state="modal"
    title="Upload API description?"
    @close="uploadConsent.respond(false)">
    <div class="text-sm leading-relaxed">
      <div class="text-c-2 mb-3 flex items-start gap-2">
        <ScalarIconFileText
          aria-hidden="true"
          class="mt-0.5 size-4 shrink-0" />
        <span class="min-w-0 break-words">
          <span class="text-c-1 font-medium">{{ info.title }}</span>
          <span
            v-if="info.version"
            class="ml-2"
            >{{ info.version }}</span
          >
        </span>
      </div>
      <p class="text-c-2">
        Ask AI uploads this API description to
        <a
          class="underline"
          href="https://scalar.com"
          rel="noopener noreferrer"
          target="_blank"
          >Scalar</a
        >. Anyone with the link can access it. It is automatically deleted after
        7 days.
      </p>
      <div class="mt-5 flex flex-wrap justify-end gap-2">
        <ScalarButton
          variant="outlined"
          @click="uploadConsent.respond(false)">
          Cancel
        </ScalarButton>
        <ScalarButton @click="confirm"> Upload and continue </ScalarButton>
      </div>
    </div>
  </ScalarModal>
</template>
