<script setup lang="ts">
import { ScalarIcon, ScalarModal, useModal } from '@scalar/components'
import { isLocalUrl } from '@scalar/oas-utils/helpers'
import { normalize } from '@scalar/openapi-parser'
import type { OpenAPI } from '@scalar/openapi-types'
import {
  getThemeStyles,
  themeIds,
  type IntegrationThemeId,
} from '@scalar/themes'
import { useColorMode } from '@scalar/use-hooks/useColorMode'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import WatchModeToggle from '@/components/CommandPalette/WatchModeToggle.vue'
import { useUrlPrefetcher } from '@/components/ImportCollection/hooks/useUrlPrefetcher'
import ImportNowButton from '@/components/ImportCollection/ImportNowButton.vue'
import IntegrationLogo from '@/components/ImportCollection/IntegrationLogo.vue'
import PrefetchError from '@/components/ImportCollection/PrefetchError.vue'
import { getOpenApiVersion } from '@/components/ImportCollection/utils/get-openapi-version'
import { isDocument } from '@/components/ImportCollection/utils/is-document'
import { isUrl } from '@/components/ImportCollection/utils/is-url'
import WorkspaceSelector from '@/components/ImportCollection/WorkspaceSelector.vue'
import { useWorkspace } from '@/store'
import { useActiveEntities } from '@/store/active-entities'

const props = defineProps<{
  source: string | null
  integration: string | null
  eventType: 'drop' | 'paste' | 'query' | null
}>()

const emits = defineEmits<{
  (e: 'importFinished'): void
}>()

const { activeWorkspace } = useActiveEntities()
const { workspaceMutators, events } = useWorkspace()

const { prefetchResult, prefetchUrl, resetPrefetchResult } = useUrlPrefetcher()

const modalState = useModal()

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
  getOpenApiVersion(prefetchResult.content || props.source || ''),
)

const { darkLightMode } = useColorMode()
const { currentRoute } = useRouter()

/** Grab light and dark logos from the url query params */
const companyLogo = computed(() => {
  try {
    const query = currentRoute.value.query
    const logo =
      darkLightMode.value === 'dark' ? query.dark_logo : query.light_logo

    if (logo) {
      return decodeURIComponent(logo as string)
    }
  } catch {
    // No harm no foul
  }

  return null
})

/** Open/close modal on events  */
watch(
  () => props.source,
  async (value) => {
    resetPrefetchResult()

    if (isUrl(value)) {
      // For drop & paste events only:
      const isDropOrPasteEvent =
        props.eventType && ['paste', 'drop'].includes(props.eventType)

      if (isDropOrPasteEvent) {
        // Check whether the URL is pointing to an OpenAPI document
        const { error } = await prefetchUrl(
          value,
          activeWorkspace.value?.proxyUrl,
        )

        if (error) {
          modalState.hide()
        } else {
          modalState.show()
        }

        return
      }

      // Query parameters:
      prefetchUrl(value, activeWorkspace.value?.proxyUrl)

      modalState.show()

      return
    }

    if (!value) {
      modalState.hide()
    } else if (isDocument(value) && getOpenApiVersion(value)) {
      modalState.show()
    } else {
      modalState.hide()
    }
  },
)

const hasUrl = computed(() => !!props.source && isUrl(props.source))
const hasContent = computed(() => !!props.source && isDocument(props.source))

/** Show the integration icon only for local URLs */
const shouldShowIntegrationIcon = computed(() => {
  return prefetchResult.url && isLocalUrl(prefetchResult.url)
})

// Function to add/remove class from body
const toggleBodyClass = (add: boolean) => {
  document.body.classList.remove('has-no-import-url')

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
const themeStyleTag = computed(
  () =>
    activeWorkspace.value &&
    shouldShowIntegrationIcon.value &&
    props.integration &&
    `<style>${getThemeStyles(props.integration as IntegrationThemeId)}</style>`,
)

function handleImportFinished() {
  // If the integration is not a valid theme id, set the theme to default
  const isIntegrationThemeId = (value: string): value is IntegrationThemeId =>
    themeIds.includes(value as IntegrationThemeId)

  const integrationThemeId =
    props.integration && isIntegrationThemeId(props.integration)
      ? props.integration
      : 'default'

  if (shouldShowIntegrationIcon.value) {
    workspaceMutators.edit(
      activeWorkspace.value?.uid,
      'themeId',
      integrationThemeId,
    )
  }
  emits('importFinished')
}
</script>

<template>
  <ScalarModal
    size="full"
    :state="modalState">
    <div
      v-if="themeStyleTag"
      v-html="themeStyleTag" />
    <div
      class="relative flex h-screen flex-col justify-center overflow-hidden px-6 md:px-0">
      <div class="section-flare">
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
        <div class="section-flare-item" />
      </div>
      <!-- Wait until the URL is fetched -->
      <div
        class="m-auto flex w-full max-w-[380px] flex-col items-center rounded-xl border px-8 py-8 transition-opacity"
        :class="{ 'opacity-0': prefetchResult.state === 'loading' }">
        <!-- Prefetch error -->
        <!-- Or: Document doesn't even have an OpenAPI/Swagger version, something is probably wrong -->
        <template
          v-if="
            prefetchResult.error && prefetchResult.state === 'idle' && !version
          ">
          <!-- Heading -->
          <div class="text-md mb-2 line-clamp-1 text-center font-bold">
            No OpenAPI document found
          </div>
          <PrefetchError :url="prefetchResult?.input || props.source" />
        </template>
        <!-- Sucess -->
        <template v-else>
          <!-- Integration Logo -->
          <div
            v-if="shouldShowIntegrationIcon"
            class="mb-2 flex items-center justify-center p-1">
            <div class="size-10 rounded-xl">
              <IntegrationLogo :integration="integration" />
            </div>
          </div>

          <!-- Company Logo -->
          <img
            v-else-if="companyLogo"
            alt="Logo"
            class="mb-2 w-full object-contain"
            :src="companyLogo" />

          <!-- Title -->
          <div
            v-if="!companyLogo"
            class="text-md mb-2 line-clamp-1 text-center font-bold">
            {{ title || 'Untitled Collection' }}
          </div>

          <div class="text-c-1 text-center text-sm font-medium text-balance">
            Import the OpenAPI document to instantly send API requests. No
            signup required.
          </div>

          <!-- Actions -->
          <template v-if="version">
            <div class="z-10 inline-flex w-full flex-col items-center gap-2">
              <ImportNowButton
                :source="
                  prefetchResult?.url ?? prefetchResult?.content ?? source
                "
                variant="button"
                :watchMode="watchMode"
                @importFinished="handleImportFinished" />
            </div>
            <!-- Select the workspace -->
            <div class="flex justify-center">
              <div
                class="text-c-3 inline-flex items-center px-4 py-1 text-xs font-medium">
                Import to: <WorkspaceSelector />
              </div>
            </div>
            <!-- Watch Mode -->
            <template v-if="prefetchResult?.url">
              <div class="mt-5 overflow-hidden border-t pt-4 text-sm">
                <div class="flex items-center justify-center">
                  <WatchModeToggle
                    v-model="watchMode"
                    :disableToolTip="true" />
                </div>
                <div
                  class="text-c-3 pt-0 text-center text-xs font-medium text-balance">
                  Automatically update your API client when the OpenAPI document
                  content changes.
                </div>
              </div>
            </template>
          </template>
        </template>
      </div>
      <!-- Download Link -->
      <div class="flex flex-col items-center justify-center pb-8">
        <div class="flex flex-col items-center text-center">
          <div
            class="mb-2 flex h-10 w-10 items-center justify-center rounded-[10px] border">
            <a
              href="https://scalar.com/download"
              target="_blank">
              <ScalarIcon
                icon="Logo"
                size="xl" />
            </a>
          </div>
          <span class="text-c-2 text-sm leading-snug font-medium">
            <a
              class="hover:text-c-1 mb-1 inline-block underline-offset-2"
              href="https://scalar.com/download"
              target="_blank">
              Download Desktop App
            </a>
            <br />
            free · open-source · offline first
          </span>
        </div>
      </div>
    </div>
  </ScalarModal>
</template>
<style>
@reference "@/style.css";

@variant md {
  .has-no-import-url,
  .has-import-url {
    max-width: 100dvw;
    overflow-x: hidden;
    contain: paint;
  }
  .has-no-import-url .scalar-client > main {
    opacity: 1;
    background: var(--scalar-background-1);
    animation: transform-restore-layout ease-in-out 0.3s forwards;
  }
  .has-import-url .scalar-client > main {
    opacity: 0;
    transform: scale(0.85) translate3d(calc(50dvw + 80px), 0, 0);
    animation: transform-fade-layout ease-in-out 0.3s forwards;
    border: var(--scalar-border-width) solid var(--scalar-border-color);
    border-radius: 12px;
    overflow: hidden;
    z-index: 10000;
  }
  .has-import-url .scalar-client .sidenav {
    display: none;
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
.section-flare {
  position: fixed;
  top: 0;
  right: -50dvw;
}
</style>
