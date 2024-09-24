<script setup lang="ts">
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarCodeBlock,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import WorkspaceDropdown from '../../views/Request/components/WorkspaceDropdown.vue'

const props = defineProps<{
  input: string | null
  title?: string | null
}>()

const emit = defineEmits<{
  (e: 'importFinished'): void
}>()

const router = useRouter()

const APP_DOWNLOAD_URL = 'https://scalar.com/download'

const modalState = useModal()

const { importSpecFromUrl, importSpecFile, activeWorkspace } = useWorkspace()
const { toast } = useToasts()

watch(
  () => props.input,
  (v) => {
    if (v) {
      modalState.show()
    } else {
      modalState.hide()
    }
  },
)

// TODO: What if an OpenAPI document is passed directly?
const url = computed(() => {
  return props.input
})

const isUrl = computed(
  () =>
    props.input &&
    (props.input?.startsWith('http://') || props.input?.startsWith('https://')),
)

const isDocument = computed(() => props.input && !isUrl.value)

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

/** App link (based on the given url) */
const scalarAppLink = computed(() => {
  if (!url.value) {
    return ''
  }

  // Redirect
  const target = `scalar://${encodeURIComponent(url.value)}`

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
    if (props.input) {
      if (isUrl.value) {
        const collection = await importSpecFromUrl(
          props.input,
          undefined,
          undefined,
          activeWorkspace.value.uid,
        )
        redirectToFirstRequestInCollection(collection)
      } else {
        const collection = await importSpecFile(
          props.input,
          activeWorkspace.value.uid,
        )
        redirectToFirstRequestInCollection(collection)
      }

      toast('Import successful', 'info')
      modalState.hide()
      emit('importFinished')
    }
  } catch (error) {
    console.error('ERROR', error)
    const errorMessage = (error as Error)?.message || 'Unknown error'
    toast(`Import failed: ${errorMessage}`, 'error')
  }
}

async function joinTheWaitlist() {
  window.location.href = APP_DOWNLOAD_URL
}

function redirectToFirstRequestInCollection(collection?: Collection) {
  if (!collection) {
    return
  }

  router.push({
    name: 'request',
    params: {
      workspace: activeWorkspace.value.uid,
      request: collection?.requests[0],
    },
  })
}
</script>

<template>
  <ScalarModal
    size="lg"
    :state="modalState"
    title="Import Collection">
    <div class="p-3 flex flex-col gap-2 items-center">
      <!-- Active Workspace -->
      <p class="w-2/3 m-4">
        You are about to import the following
        {{ isUrl ? 'url' : 'document' }} as a new collection to your workspace:
      </p>
      <div class="w-2/3 border">
        <WorkspaceDropdown />
      </div>
      <!-- Preview -->
      <template v-if="input && isUrl">
        <div class="w-2/3 overflow-hidden border rounded mb-10">
          <ScalarCodeBlock :content="input" />
        </div>
      </template>
      <template v-else-if="input && isDocument">
        <div class="w-2/3 h-32 overflow-hidden border rounded mb-10">
          <ScalarCodeBlock
            :content="input"
            lang="json" />
        </div>
      </template>
      <!-- The title -->
      <div
        v-if="title"
        class="font-bold p-2">
        {{ title }}
      </div>
      <div class="flex flex-col gap-2 w-1/2">
        <!-- Open in App (only URLs) -->
        <template v-if="isUrl">
          <!-- Join the waitlist -->
          <template v-if="platform === 'Windows'">
            <ScalarButton
              class="px-6 max-h-8 w-full gap-2"
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
              class="px-6 max-h-8 w-full gap-2"
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
        </template>

        <!-- Import right-away -->
        <ScalarButton
          class="px-6 max-h-8 w-full gap-2 hover:bg-b-2"
          size="md"
          type="button"
          :variant="isDocument ? 'solid' : 'outlined'"
          @click="importCollection">
          <ScalarIcon
            icon="CodeFolder"
            size="md" />
          Import Collection
        </ScalarButton>
      </div>
      <!-- Download link -->
      <div class="py-4 text-center text-sm">
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
