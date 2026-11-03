<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { isObject } from '@scalar/helpers/object/is-object'
import { safeRun } from '@scalar/helpers/types/safe-run'
import { ScalarIconFileText } from '@scalar/icons'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

import { URLS } from '@/consts/urls'
import { useState } from '@/state/state'

const emit = defineEmits<{ retry: [] }>()
const { uploadConsent, uploadState, terms, mode } = useState()
const heading = useTemplateRef<HTMLHeadingElement>('heading')
const cancelled = computed(() => uploadState.value?.type === 'cancelled')
const needsTerms = computed(() => mode === 'preview' && !terms.accepted.value)
const agreedToTerms = ref(false)
const canContinue = computed(() => !needsTerms.value || agreedToTerms.value)
const confirm = (): void => {
  if (!canContinue.value) {
    return
  }
  if (needsTerms.value) {
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

watch(cancelled, async () => {
  await nextTick()
  heading.value?.focus()
})
</script>

<template>
  <section
    class="bg-b-1 text-c-1 w-full rounded-xl border p-5 text-sm leading-relaxed sm:p-6">
    <h2
      ref="heading"
      class="text-lg font-medium outline-none"
      tabindex="-1">
      {{
        cancelled
          ? 'Your API description has not been uploaded'
          : 'Upload API description to Ask AI?'
      }}
    </h2>
    <div class="text-c-2 mt-4 flex items-start gap-2">
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
    <p class="text-c-2 mt-4">
      {{
        cancelled
          ? 'Upload your API description when you are ready to ask questions about it.'
          : 'Your complete API description will be uploaded to Scalar to answer your questions.'
      }}
    </p>
    <template v-if="!cancelled">
      <div class="mt-4 space-y-1">
        <p class="font-medium">Anyone with the link can access it.</p>
        <p class="text-c-2">
          The uploaded document is automatically deleted after 7 days.
        </p>
      </div>
      <p class="text-c-2 mt-4">
        Check that the document contains no secrets or private information you
        are not allowed to share.
      </p>
      <label
        v-if="needsTerms"
        class="mt-5 flex items-start gap-2">
        <input
          v-model="agreedToTerms"
          class="mt-1 size-4 shrink-0"
          type="checkbox" />
        <span
          >I agree to the
          <a
            class="underline"
            :href="URLS.TERMS_AND_CONDITIONS"
            target="_blank"
            >Terms &amp; Conditions</a
          >
          and
          <a
            class="underline"
            :href="URLS.PRIVACY_POLICY"
            target="_blank"
            >Privacy Policy</a
          >.</span
        >
      </label>
      <div class="mt-6 flex flex-wrap justify-end gap-2 border-t pt-4">
        <ScalarButton
          variant="outlined"
          @click="uploadConsent.respond(false)">
          Cancel
        </ScalarButton>
        <ScalarButton
          :disabled="!canContinue"
          @click="confirm">
          Upload and continue
        </ScalarButton>
      </div>
    </template>
    <div
      v-else
      class="mt-6 flex justify-end">
      <ScalarButton
        variant="outlined"
        @click="emit('retry')">
        Upload API description
      </ScalarButton>
    </div>
  </section>
</template>
