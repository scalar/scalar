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
import { isJsonString, redirectToProxy } from '@scalar/oas-utils/helpers'
import { useToasts } from '@scalar/use-toasts'
import { computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { parse } from 'yaml'

const props = defineProps<{
  input: string | null
  title?: string | null
}>()

const emit = defineEmits<{
  (e: 'importFinished'): void
}>()

type PrefetchResult = {
  state: 'idle' | 'loading'
  content: string | null
  error: string | null
  version: string | null
}

const prefetchResult = reactive<PrefetchResult>({
  state: 'idle',
  content: null,
  error: null,
  version: null,
})

const router = useRouter()

const APP_DOWNLOAD_URL = 'https://scalar.com/download'

const modalState = useModal()

const { importSpecFromUrl, importSpecFile, activeWorkspace } = useWorkspace()
const { toast } = useToasts()

watch(
  () => props.input,
  (value) => {
    prefetchUrl(value, activeWorkspace.value.proxyUrl)

    if (!value) {
      modalState.hide()
    } else if (isUrl(value)) {
      modalState.show()
    } else if (isDocument(value) && getOpenApiDocumentVersion(value)) {
      modalState.show()
    } else {
      modalState.hide()
    }
  },
)

// TODO: This does not work with URLs to API references and such.
async function prefetchUrl(value: string | null, proxy?: string) {
  // No URL
  if (!value || !isUrl(value)) {
    return Object.assign(prefetchResult, {
      state: 'idle',
      content: null,
      error: null,
      version: null,
    })
  }

  Object.assign(prefetchResult, {
    state: 'loading',
    content: null,
    error: null,
    version: null,
  })

  // TODO: Remove wait
  await new Promise((resolve) => setTimeout(resolve, 1000))

  try {
    const result = await fetch(redirectToProxy(proxy, value), {
      cache: 'no-store',
    })

    if (!result.ok) {
      return Object.assign(prefetchResult, {
        state: 'idle',
        content: null,
        error: `Couldn’t fetch the URL, got error ${[result.status, result.statusText].join(' ').trim()}.`,
        version: null,
      })
    }

    const content = await result.text()
    const version = getOpenApiDocumentVersion(content)

    return Object.assign(prefetchResult, {
      state: 'idle',
      content,
      error: null,
      version,
    })
  } catch (error: any) {
    console.error('[prefetchDocument]', error)

    return Object.assign(prefetchResult, {
      state: 'idle',
      content: null,
      error: error?.message,
      version: null,
    })
  }
}

function isUrl(input: string | null) {
  return input && (input.startsWith('http://') || input.startsWith('https://'))
}

// TODO: Doesn’t work: "blob:https://outline.apidocumentation.com/e9cf4232-e27d-4535-b297-8474610f3043"

function isDocument(input: string | null) {
  return input && !isUrl(input)
}

function getOpenApiDocumentVersion(input: string | null) {
  if (!isDocument(input)) {
    return false
  }

  try {
    const result = JSON.parse(input ?? '')

    if (typeof result?.openapi === 'string') {
      return `OpenAPI ${result.openapi} (JSON)`
    }

    if (typeof result?.swagger === 'string') {
      return `Swagger ${result.swagger} (JSON)`
    }

    return false
  } catch {
    //
  }

  try {
    const result = parse(input ?? '')

    if (typeof result?.openapi === 'string') {
      return `OpenAPI ${result.openapi} (YAML)`
    }

    if (typeof result?.swagger === 'string') {
      return `Swagger ${result.swagger} (YAML)`
    }

    return false
  } catch {
    //
  }

  return false
}

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
  if (!props.input || !isUrl(props.input)) {
    return ''
  }

  // Redirect
  const target = `scalar://${encodeURIComponent(props.input)}`

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
      if (isUrl(props.input)) {
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
    console.error('[importCollection]', error)

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
    size="md"
    :state="modalState"
    title="Import Collection">
    <div class="flex flex-col gap-4">
      <!-- Text -->
      <p>
        You’re importing an OpenAPI
        {{ isUrl(input) ? 'document URL' : 'document' }} to your workspace.
      </p>
      <div class="flex gap-2 flex-col w-full">
        <!-- URL preview -->
        <template v-if="input && isUrl(input)">
          <!-- The title -->
          <div
            v-if="title"
            class="font-bold p-2">
            {{ title }}
          </div>
          <div class="overflow-hidden border rounded">
            <ScalarCodeBlock :content="input" />
          </div>
          <div class="text-sm">
            <template v-if="prefetchResult.state === 'loading'">
              <div
                class="w-full p-4 border text-center h-12 flex justify-center items-center bg-b-2">
                <div>fetching…</div>
              </div>
            </template>
            <template v-else>
              <template v-if="prefetchResult.version">
                <div class="flex gap-2 flex-col w-full">
                  <div class="text-sm text-c-3 font-medium pt-2">
                    <div class="flex gap-2 items-center">
                      <ScalarIcon
                        class="text-green"
                        icon="Checkmark"
                        size="sm" />
                      <div>
                        {{ prefetchResult.version }}
                      </div>
                    </div>
                  </div>
                  <div class="h-32 overflow-hidden border rounded">
                    <ScalarCodeBlock
                      :content="prefetchResult.content ?? ''"
                      :lang="
                        isJsonString(prefetchResult.content) ? 'json' : 'yaml'
                      " />
                  </div>
                </div>
              </template>
              <div>
                <template v-if="prefetchResult.error">
                  <div class="flex gap-2 items-center">
                    <ScalarIcon
                      class="text-red"
                      icon="Error"
                      size="sm" />
                    <div>
                      {{ prefetchResult.error }}
                    </div>
                  </div>
                </template>
                <template v-else-if="!prefetchResult.version">
                  <div class="flex flex-col gap-2">
                    <div class="flex items-center gap-2">
                      <ScalarIcon
                        class="text-red"
                        icon="Error"
                        size="sm" />
                      <div>
                        This doesn’t look like an OpenAPI/Swagger document:
                      </div>
                    </div>
                    <div class="border rounded h-32 overflow-hidden">
                      <ScalarCodeBlock
                        :content="prefetchResult.content?.trim() ?? ''" />
                    </div>
                  </div>
                </template>
              </div>
            </template>
          </div>
        </template>
        <!-- Document preview -->
        <template v-else-if="input && isDocument(input)">
          <div class="text-sm text-c-3 font-medium pt-2">
            <div class="flex gap-2 items-center">
              <ScalarIcon
                class="text-green"
                icon="Checkmark"
                size="sm" />
              <div>
                {{ getOpenApiDocumentVersion(input) }}
              </div>
            </div>
          </div>
          <div class="h-32 overflow-hidden border rounded">
            <ScalarCodeBlock
              :content="input"
              :lang="isJsonString(input) ? 'json' : 'yaml'" />
          </div>
        </template>
      </div>
      <div class="flex gap-2 w-full mt-4">
        <!-- Import right-away -->
        <ScalarButton
          class="px-6 max-h-8 w-full gap-2"
          size="md"
          type="button"
          :variant="isDocument(input) ? 'solid' : 'outlined'"
          @click="importCollection">
          <ScalarIcon
            icon="CodeFolder"
            size="md" />
          <template v-if="isDocument(input)">Import Collection</template>
          <template v-else>Open in the Browser</template>
        </ScalarButton>

        <!-- Open in App (only URLs) -->
        <template v-if="scalarAppLink">
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
      </div>

      <!-- Download link -->
      <div
        v-if="scalarAppLink"
        class="text-sm mt-4">
        Don’t have the Scalar app?
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
