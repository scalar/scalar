<script setup lang="ts">
import { useWorkspace } from '@/store'
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { useToasts } from '@scalar/use-toasts'
import { computed, watch } from 'vue'

const props = defineProps<{
  input: string | null
  title?: string | null
}>()

const emit = defineEmits<{
  (e: 'importFinished'): void
}>()

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

/** App link (based on url) */
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
      if (
        props.input.startsWith('http://') ||
        props.input.startsWith('https://')
      ) {
        const collection = await importSpecFromUrl(props.input)
        console.log('url', collection)
      } else {
        const collection = await importSpecFile(props.input)
        console.log('file', collection)
      }

      toast('Import successfully completed', 'info')
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
  window.location.href = 'https://scalar.com/download'
}
</script>

<template>
  <ScalarModal
    size="lg"
    :state="modalState"
    title="Import Collection">
    <div class="p-3 flex flex-col gap-2 items-center">
      <!-- Active Workspace -->
      Workspace: {{ activeWorkspace.name }}
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
