<script lang="ts" setup>
import { ScalarButton, ScalarIcon } from '@scalar/components'
import '@scalar/components/style.css'
import '@scalar/themes/style.css'
import { computed } from 'vue'

/**
 * Operating system of the user
 */
const platform = computed(() => {
  const userAgent = navigator.userAgent.toLowerCase()

  if (userAgent.includes('win')) return 'Windows'
  if (userAgent.includes('mac')) return 'macOS'
  if (userAgent.includes('linux')) return 'Linux'

  return ''
})

/** Title (`title` query parameter) */
const title = computed(() => {
  const urlParams = new URLSearchParams(window.location.search)

  // Get the `title` parameter
  return urlParams.get('title')
})

/** App link (based on `url` parameter) */
const scalarAppLink = computed(() => {
  const urlParams = new URLSearchParams(window.location.search)

  // Get the `url` parameter
  const url = urlParams.get('url')

  if (!url) {
    return ''
  }

  // Redirect
  const target = `scalar://${encodeURIComponent(url)}`

  console.info(`Opening ${target} …`)

  return target
})

/** Open the app */
function openScalarApp() {
  if (scalarAppLink.value) {
    window.location.href = scalarAppLink.value
  }
}
</script>

<template>
  <div class="scalar-app light-mode">
    <div class="h-screen p-3 flex flex-col">
      <header class="p-3">
        <ScalarIcon
          icon="Logo"
          size="2xl" />
      </header>
      <main class="flex-1 flex items-center justify-center">
        <div class="p-3 flex flex-col gap-2">
          <div
            v-if="title"
            class="text-md font-bold p-3"
            style="text-align: center">
            {{ title }}
          </div>
          <ScalarButton
            class="px-6 max-h-8 w-full gap-2 text-xs hover:bg-b-2"
            size="md"
            type="button"
            variant="solid"
            @click="openScalarApp">
            <ScalarIcon
              icon="Download"
              size="md" />
            Open in Scalar
            <template v-if="platform"> for {{ platform }} </template>
          </ScalarButton>
          <ScalarButton
            class="px-6 max-h-8 w-full gap-2 text-xs hover:bg-b-2"
            size="md"
            type="button"
            variant="outlined">
            <ScalarIcon
              icon="Workspace"
              size="md" />
            View in the Browser
          </ScalarButton>
          <div class="text-sm py-4 text-center">
            Don’t have the app?
            <a
              href="https://scalar.com/download"
              target="_blank">
              Download it for free
            </a>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
