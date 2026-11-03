<script setup lang="ts">
import { ScalarButton } from '@scalar/components/button'
import { ScalarModal } from '@scalar/components/modal'

import { useState } from '@/state/state'

const { uploadConsent } = useState()
</script>

<template>
  <ScalarModal
    size="xs"
    :state="uploadConsent.modal"
    title="Upload this API description?"
    @close="uploadConsent.respond(false)">
    <p class="text-c-2 text-sm leading-normal">
      The entire API description will be uploaded to Scalar to answer your
      questions. Anyone with its share link can access it. The uploaded document
      is automatically deleted after 7 days.
    </p>
    <p class="text-c-2 mt-2 text-sm leading-normal">
      Only continue if you are allowed to share this document, including any
      private information or secrets it contains.
    </p>
    <div class="mt-4 flex justify-end gap-2">
      <ScalarButton
        variant="outlined"
        @click="uploadConsent.respond(false)">
        Cancel
      </ScalarButton>
      <ScalarButton @click="uploadConsent.respond(true)">
        Upload and continue
      </ScalarButton>
    </div>
  </ScalarModal>
</template>
