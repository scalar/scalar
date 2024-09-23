<script lang="ts" setup>
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, onMounted, ref } from 'vue'

const { importSpecFromUrl } = useWorkspace()
const { toast } = useToasts()

/**
 * Operating system of the user
 */
const platform = computed((): 'Windows' | 'macOS' | 'Linux' | '' => {
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

async function importCollection() {
  try {
    await importSpecFromUrl(url.value)
    toast('Import successful', 'info')
    modalState.hide()
  } catch (error) {
    console.error('the error ', error)
    const errorMessage = (error as Error)?.message || 'Unknown error'
    toast(`Import failed: ${errorMessage}`, 'error')
  }
}

async function joinTheWaitlist() {
  window.location.href = 'https://scalar.com/download'
}

const url = ref('')
const modalState = useModal()

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const urlParam = urlParams.get('url')

  if (urlParam) {
    url.value = urlParam
    modalState.show()
  }
})
</script>

<template>
  <ScalarModal
    size="lg"
    :state="modalState"
    title="Import Collection">
    <div class="p-3 flex flex-col gap-2 items-center">
      <!-- The title -->
      <div
        v-if="title"
        class="text-sm font-bold p-2">
        {{ title }}
      </div>
      <div class="flex flex-col gap-2 w-1/2">
        <!-- Join the waitlist -->
        <template v-if="platform === 'Windows'">
          <ScalarButton
            class="px-6 max-h-8 w-full gap-2 text-xs"
            size="md"
            type="button"
            variant="solid"
            @click="joinTheWaitlist">
            <ScalarIcon
              icon="Email"
              size="md" />
            Join the waitlist for Windows
          </ScalarButton>
        </template>
        <!-- Open the app -->
        <template v-else>
          <ScalarButton
            class="px-6 max-h-8 w-full gap-2 text-xs"
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
        </template>

        <!-- Import right-away -->
        <ScalarButton
          class="px-6 max-h-8 w-full gap-2 text-xs hover:bg-b-2"
          size="md"
          type="button"
          variant="outlined"
          @click="importCollection">
          <ScalarIcon
            icon="Workspace"
            size="md" />
          Open in the Browser
        </ScalarButton>
      </div>
      <!-- Download link -->
      <div class="text-sm py-4 text-center">
        Don’t have the app?
        <a
          href="https://scalar.com/download"
          target="_blank">
          Download it for free
        </a>
      </div>
    </div>
  </ScalarModal>
</template>

<style scoped>
.import-flow {
  outline: 1px solid red;
}

.modal {
  display: block;
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgb(0, 0, 0);
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  background-color: #fefefe;
  margin: 15% auto;
  padding: 20px;
  border: 1px solid #888;
  width: 80%;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}
</style>
