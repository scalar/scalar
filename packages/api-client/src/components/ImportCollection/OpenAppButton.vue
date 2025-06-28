<script lang="ts" setup>
// TODO: We don't need this button in Electron
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { computed } from 'vue'

import { isUrl } from '@/components/ImportCollection/utils/is-url'

const props = defineProps<{
  source?: string | null
}>()

const APP_DOWNLOAD_URL = 'https://scalar.com/download'

/** Operating system of the user */
const platform = computed((): 'Windows' | 'macOS' | 'Linux' | '' => {
  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('win')) {
    return 'Windows'
  }
  if (userAgent.includes('mac')) {
    return 'macOS'
  }
  if (userAgent.includes('linux')) {
    return 'Linux'
  }

  return ''
})

/** App link (based on the given url) */
const scalarAppLink = computed(() => {
  if (!props.source || !isUrl(props.source)) {
    return ''
  }

  return `scalar://${encodeURIComponent(props.source)}`
})

/** Open the app */
function openScalarApp() {
  console.info(`Opening ${props.source} …`)

  if (scalarAppLink.value) {
    window.location.href = scalarAppLink.value
  }
}

async function redirectToWaitList() {
  window.location.href = APP_DOWNLOAD_URL
}
</script>

<template>
  <!-- Open in App (only URLs) -->
  <template v-if="scalarAppLink">
    <!-- Join the waitlist -->
    <template v-if="platform === 'Windows'">
      <ScalarButton
        class="gap-2"
        size="md"
        type="button"
        variant="solid"
        @click="redirectToWaitList">
        <ScalarIcon
          icon="Email"
          size="md" />
        Join the waitlist for Windows
      </ScalarButton>
    </template>
    <!-- Open the app -->
    <template v-else>
      <ScalarButton
        class="gap-2"
        size="md"
        type="button"
        variant="solid"
        @click="openScalarApp">
        <ScalarIcon
          icon="Import"
          size="md" />
        Open in Scalar
        <template v-if="platform"> for {{ platform }} </template>
      </ScalarButton>
    </template>
  </template>
</template>
