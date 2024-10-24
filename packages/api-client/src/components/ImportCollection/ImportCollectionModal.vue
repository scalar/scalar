<script setup lang="ts">
import WatchModeToggle from '@/components/CommandPalette/WatchModeToggle.vue'
import { useUrlPrefetcher } from '@/components/ImportCollection/hooks/useUrlPrefetcher'
import { getOpenApiDocumentVersion } from '@/components/ImportCollection/utils/getOpenApiDocumentVersion'
import { isDocument } from '@/components/ImportCollection/utils/isDocument'
import { isUrl } from '@/components/ImportCollection/utils/isUrl'
import { useWorkspace } from '@/store'
import {
  ScalarCodeBlock,
  ScalarIcon,
  ScalarModal,
  useModal,
} from '@scalar/components'
import { normalize } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import type { ReferenceConfiguration } from '@scalar/types/legacy'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import ImportNowButton from './ImportNowButton.vue'
import WorkspaceSelector from './WorkspaceSelector.vue'

// import OpenAppButton from './OpenAppButton.vue'

const props = defineProps<{
  source: string | null
  integration: string | null
}>()

defineEmits<{
  (e: 'importFinished'): void
}>()

const { activeWorkspace, events } = useWorkspace()

const { prefetchResult, prefetchUrl } = useUrlPrefetcher()

const modalState = useModal()
const errorModalState = useModal()

const errorMessage = ref('')
const watchMode = ref<boolean>(true)

/** Close modal when a keyboard shortcut is pressed */
events.hotKeys.on(() => modalState.hide())

/** Try to make the retrieved content an OpenAPI document */
const openApiDocument = computed(() => {
  try {
    return normalize(
      prefetchResult.content || props.source || '',
    ) as OpenAPI.Document
  } catch {
    return undefined
  }
})

/** Title from the OpenAPI document */
const title = computed(() => openApiDocument.value?.info?.title)

/** The OpenAPI/Swagger version */
const version = computed(() =>
  getOpenApiDocumentVersion(prefetchResult.content || props.source || ''),
)

/** Open/close modal on events  */
watch(
  () => props.source,
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

const hasUrl = computed(() => !!props.source && isUrl(props.source))
const hasContent = computed(() => !!props.source && isDocument(props.source))

/** All available framework logos */
const availableIntegrationIcons: Exclude<
  ReferenceConfiguration['_integration'],
  null | undefined | 'html'
>[] = [
  'adonisjs',
  'dotnet',
  'elysiajs',
  'express',
  'fastapi',
  'fastify',
  'go',
  'hono',
  'laravel',
  'litestar',
  'nestjs',
  'nextjs',
  'nitro',
  'nuxt',
  'platformatic',
  'react',
  'rust',
]

/** Icon for the @scalar/api-reference integration the user is coming from */
const integrationIcon = computed(() => {
  const defaultIcon = 'Openapi' as const
  const integration = props.integration?.toLocaleLowerCase()

  if (!integration) return defaultIcon

  const capitalized = integration.charAt(0).toUpperCase() + integration.slice(1)

  return availableIntegrationIcons.includes(integration as any)
    ? (capitalized as Capitalize<(typeof availableIntegrationIcons)[number]>)
    : defaultIcon
})

// Function to add/remove class from body
const toggleBodyClass = (add: boolean) => {
  if (add && (hasUrl.value || hasContent.value) && modalState.open) {
    document.body.classList.add('has-import-url')
  } else {
    document.body.classList.remove('has-import-url')
  }
}

/** Toggles the 'has-import-url' class on the body element */
const closeModal = () => {
  document.body.classList.remove('has-import-url')
  document.body.classList.add('has-no-import-url')
}

// Watch for changes in the modal state
watch(
  () => modalState.open,
  (isOpen) => {
    if (isOpen) {
      toggleBodyClass(true)
    } else {
      closeModal()
    }
  },
)

// Watch for changes in the source prop
watch(
  () => props.source,
  () => {
    toggleBodyClass(true)
  },
)

// Add class on mount if URL exists and modal is visible
onMounted(() => {
  toggleBodyClass(true)
})

// Remove classes on unmount
onUnmounted(() => {
  document.body.classList.remove('has-import-url')
  document.body.classList.remove('has-no-import-url')
})

const handleExpandError = (message: string) => {
  errorMessage.value = message
  errorModalState.show()
}
</script>

<template>
  <ScalarModal
    size="full"
    :state="modalState">
    <div
      class="flex flex-col h-screen justify-center px-6 overflow-hidden relative md:px-0">
      <div
        class="flex items-center flex-col m-auto px-8 py-8 rounded-xl border-1/2 max-w-[380px] w-full">
        <!-- Wait until the URL is fetched -->
        <template v-if="prefetchResult.state === 'idle'">
          <!-- Logo -->
          <div class="flex justify-center items-center mb-4 p-1">
            <div class="rounded-xl">
              <ScalarIcon
                class="size-10 rounded-lg"
                :logo="integrationIcon" />
            </div>
          </div>
          <!-- Title -->
          <div class="text-center text-md font-bold mb-2 line-clamp-1">
            {{ title ?? 'Untitled Collection' }}
          </div>
          <div
            class="text-c-1 text-sm font-medium mb-2 text-center text-balance">
            Import the OpenAPI document to instantly send API requests. No
            signup required.
          </div>
          <!-- Prefetch error -->
          <template v-if="prefetchResult.error">
            <div
              class="flex gap-2 justify-between items-center pt-2 pl-2 pr-1.5 pb-1.5 font-code text-sm border rounded break-words mt-4 w-full">
              <div class="flex flex-1 gap-2">
                <ScalarIcon
                  class="text-red flex-shrink-0"
                  icon="Error"
                  size="sm" />
                <div class="line-clamp-4 w-full">
                  {{ prefetchResult.error.slice(0, 100) }}...
                </div>
              </div>
              <span
                class="bg-b-2 cursor-pointer inline-block self-end px-1.5 py-1 rounded text-xs"
                @click="handleExpandError(prefetchResult.error)">
                Expand
              </span>
            </div>
          </template>

          <!-- Actions -->
          <template v-else-if="version">
            <div class="inline-flex flex-col gap-2 items-center z-10 w-full">
              <!-- <OpenAppButton :source="source" /> -->
              <ImportNowButton
                :source="prefetchResult?.url ?? source"
                variant="button"
                :watchMode="watchMode"
                @importFinished="() => $emit('importFinished')" />
            </div>
            <!-- Select the workspace -->
            <div class="flex justify-center">
              <div
                class="inline-flex py-1 px-4 items-center text-xs font-medium text-c-2">
                Import to: <WorkspaceSelector />
              </div>
            </div>
            <!-- Watch Mode -->
            <template v-if="prefetchResult?.url">
              <div
                class="text-c-2 text-sm bg-b-2 rounded-lg overflow-hidden mt-6 p-4 pt-2">
                <div class="flex items-center justify-center">
                  <WatchModeToggle
                    v-model="watchMode"
                    :disableToolTip="true" />
                </div>
                <div class="pt-0 text-center text-balance font-medium text-xs">
                  Automatically update your API client when the OpenAPI document
                  content changes.
                </div>
              </div>
            </template>
          </template>

          <!-- Document doesn’t even have an OpenAPI/Swagger version, something is probably wrong -->
          <template v-else-if="!version">
            <div class="flex flex-col gap-2">
              <div
                class="flex gap-2 items-center p-3 font-code text-sm border rounded">
                <ScalarIcon
                  class="text-red"
                  icon="Error"
                  size="sm" />
                <div>
                  This doesn’t look like a valid OpenAPI/Swagger document.
                </div>
              </div>

              <div class="bg-b-2 h-48 border rounded custom-scroll">
                <ScalarCodeBlock
                  :content="
                    prefetchResult.content?.trim() || props.source?.trim() || ''
                  "
                  :copy="false" />
              </div>
            </div>
          </template>
        </template>
      </div>
      <!-- Download Link -->
      <div class="flex flex-col justify-center items-center pb-8">
        <div class="text-center flex items-center flex-col">
          <div
            class="mb-2 w-10 h-10 border rounded-[10px] flex items-center justify-center">
            <a
              href="https://scalar.com/download"
              target="_blank">
              <ScalarIcon
                icon="Logo"
                size="xl" />
            </a>
          </div>
          <span class="text-c-2 leading-snug text-sm font-medium">
            <a
              class="hover:text-c-1 underline-offset-2 mb-1 inline-block"
              href="https://scalar.com/download"
              target="_blank">
              Download Desktop App
            </a>
            <br />
            free · open-source · offline first
          </span>
        </div>
      </div>
      <!-- Error Modal -->
      <ScalarModal
        size="md"
        :state="errorModalState"
        title="Error Details"
        variant="error">
        <div>
          {{ errorMessage }}
        </div>
      </ScalarModal>
    </div>
  </ScalarModal>
</template>
<style>
@screen md {
  .has-no-import-url {
    opacity: 1;
    background: var(--scalar-background-1);
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 0, 0);
    animation: transform-restore-layout ease-in-out 0.3s forwards;
  }
  .has-import-url .scalar-client > main {
    opacity: 0;
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 0, 0);
    animation: transform-fade-layout ease-in-out 0.3s forwards;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: 12px;
    overflow: hidden;
  }
  .has-no-import-url .scalar-app,
  .has-import-url .scalar-app {
    background: var(--scalar-background-1) !important;
  }
}
@keyframes transform-fade-layout {
  0% {
    opacity: 0;
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 10px, 0);
  }
  100% {
    opacity: 1;
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 0, 0);
  }
}
@keyframes transform-restore-layout {
  0% {
    opacity: 1;
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 0, 0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translate3d(0, 0, 0);
  }
}
.openapi-color {
  color: var(--scalar-color-green);
}
</style>
