<script setup lang="ts">
import { provideUseId } from '@headlessui/vue'
import { OpenApiClientButton } from '@scalar/api-client/components'
import { LAYOUT_SYMBOL } from '@scalar/api-client/hooks'
import {
  ACTIVE_ENTITIES_SYMBOL,
  WORKSPACE_SYMBOL,
} from '@scalar/api-client/store'
import {
  addScalarClassesToHeadless,
  ScalarColorModeToggleButton,
  ScalarColorModeToggleIcon,
  ScalarErrorBoundary,
  ScalarSidebarFooter,
} from '@scalar/components'
import { sleep } from '@scalar/helpers/testing/sleep'
import {
  ScalarIconBracketsCurly,
  ScalarIconCaretDown,
  ScalarIconFileMd,
  ScalarIconGitBranch,
  ScalarIconGlobeSimple,
  ScalarIconInfo,
  ScalarIconLockSimple,
  ScalarIconWarningOctagon,
} from '@scalar/icons'
import {
  getThemeStyles,
  hasObtrusiveScrollbars,
  type ThemeId,
} from '@scalar/themes'
import { apiReferenceConfigurationSchema } from '@scalar/types/api-reference'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { ScalarToasts, useToasts } from '@scalar/use-toasts'
import { useDebounceFn, useMediaQuery, useResizeObserver } from '@vueuse/core'
import {
  computed,
  onBeforeMount,
  onMounted,
  onUnmounted,
  provide,
  ref,
  toValue,
  useId,
  watch,
} from 'vue'

import ClassicHeader from '@/components/ClassicHeader.vue'
import { Content } from '@/components/Content'
import GettingStarted from '@/components/GettingStarted.vue'
import { hasLazyLoaded } from '@/components/Lazy/lazyBus'
import MobileHeader from '@/components/MobileHeader.vue'
import { ApiClientModal } from '@/features/api-client-modal'
import { useDocumentSource } from '@/features/document-source'
import { OPENAPI_VERSION_SYMBOL } from '@/features/download-link'
import { SearchButton } from '@/features/Search'
import { Sidebar, useSidebar } from '@/features/sidebar'
import { CONFIGURATION_SYMBOL } from '@/hooks/useConfig'
import { NAV_STATE_SYMBOL, useNavState } from '@/hooks/useNavState'
import { downloadDocument, downloadEventBus } from '@/libs/download'
import { createPluginManager, PLUGIN_MANAGER_SYMBOL } from '@/plugins'
import type {
  ReferenceLayoutProps,
  ReferenceLayoutSlot,
  ReferenceSlotProps,
} from '@/types'
import { useLegacyStoreEvents } from '@/v2/hooks/use-legacy-store-events'

const {
  rawSpec,
  configuration: providedConfiguration,
  originalDocument: providedOriginalDocument,
  dereferencedDocument: providedDereferencedDocument,
  store,
} = defineProps<ReferenceLayoutProps>()

const emit = defineEmits<{
  (e: 'changeTheme', { id, label }: { id: ThemeId; label: string }): void
  (e: 'updateContent', value: string): void
  (e: 'loadSwaggerFile'): void
  (e: 'linkSwaggerFile'): void
  (e: 'toggleDarkMode'): void
}>()

const configuration = computed(() =>
  apiReferenceConfigurationSchema.parse(providedConfiguration),
)

// Configure Reference toasts to use vue-sonner
const { initializeToasts, toast } = useToasts()
initializeToasts((message) => toast(message))

defineOptions({
  inheritAttrs: false,
})

const {
  originalDocument,
  originalOpenApiVersion,
  dereferencedDocument,
  workspaceStore,
  activeEntitiesStore,
} = useDocumentSource({
  configuration,
  dereferencedDocument: providedDereferencedDocument,
  originalDocument: providedOriginalDocument,
})

provide(OPENAPI_VERSION_SYMBOL, originalOpenApiVersion)
provide(WORKSPACE_SYMBOL, workspaceStore)
provide(ACTIVE_ENTITIES_SYMBOL, activeEntitiesStore)

defineSlots<
  {
    [x in ReferenceLayoutSlot]: (props: ReferenceSlotProps) => any
  } & { 'document-selector': any }
>()

const isLargeScreen = useMediaQuery('(min-width: 1150px)')

// Track the container height to control the sidebar height
const elementHeight = ref('100dvh')
const documentEl = ref<HTMLElement | null>(null)
useResizeObserver(documentEl, (entries) => {
  elementHeight.value = entries[0]
    ? entries[0].contentRect.height + 'px'
    : '100dvh'
})

// Check for Obtrusive Scrollbars
const obtrusiveScrollbars = computed(hasObtrusiveScrollbars)

const navState = useNavState(configuration)
const { isSidebarOpen, setCollapsedSidebarItem, scrollToOperation, items } =
  useSidebar(dereferencedDocument, {
    ...navState,
    config: configuration,
  })

const {
  getReferenceId,
  getPathRoutingId,
  getSectionId,
  getTagId,
  hash,
  isIntersectionEnabled,
  updateHash,
  replaceUrlState,
} = navState

// Front-end redirect
if (configuration.value.redirect && typeof window !== 'undefined') {
  const newPath = configuration.value.redirect(
    (configuration.value.pathRouting ? window.location.pathname : '') +
      window.location.hash,
  )
  if (newPath) {
    history.replaceState({}, '', newPath)
  }
}

onBeforeMount(() => {
  // Ideally this triggers absolutely first on the client so we can set hash value
  updateHash()

  // Ensure we add our scalar wrapper class to the headless ui root, mounted is too late
  addScalarClassesToHeadless()
})

// Disables intersection observer and scrolls to section once it has been opened
const scrollToSection = async (id?: string) => {
  isIntersectionEnabled.value = false
  updateHash()

  if (id) {
    scrollToOperation(id)
  } else {
    documentEl.value?.scrollTo(0, 0)
  }

  await sleep(100)
  isIntersectionEnabled.value = true
}

const yPosition = ref(0)

onMounted(() => {
  // Prevent the browser from restoring scroll position on refresh
  history.scrollRestoration = 'manual'

  // Find scalar Y offset to support users who have tried to add their own headers
  const pbcr = documentEl.value?.parentElement?.getBoundingClientRect()
  const bcr = documentEl.value?.getBoundingClientRect()
  if (pbcr && bcr) {
    const difference = bcr.top - pbcr.top
    yPosition.value = difference < 2 ? 0 : difference
  }

  // This is what updates the hash ref from hash changes
  window.onhashchange = () => {
    scrollToSection(getReferenceId())
  }
  // Handle back for path routing
  window.onpopstate = () =>
    configuration.value.pathRouting &&
    scrollToSection(getPathRoutingId(window.location.pathname))

  // Add window scroll listener
  window.addEventListener('scroll', debouncedScroll, { passive: true })
})

const showRenderedContent = computed(
  () => isLargeScreen.value || !configuration.value.isEditable,
)

// To clear hash when scrolled to the top
const debouncedScroll = useDebounceFn(() => {
  if (window.scrollY < 50 && hasLazyLoaded.value) {
    replaceUrlState('')
  }
})

const sidebarOpened = ref(false)

// Open a sidebar tag
watch(dereferencedDocument, (newDoc) => {
  // Scroll to given hash
  if (hash.value) {
    const hashSectionId = getSectionId(hash.value)
    if (hashSectionId) {
      setCollapsedSidebarItem(hashSectionId, true)
    }
  }
  // Open the first tag
  else {
    const firstTag = newDoc.tags?.[0]

    if (firstTag) {
      setCollapsedSidebarItem(getTagId(firstTag), true)
    }
  }

  sidebarOpened.value = true
})

/** This is passed into all of the slots so they have access to the references data */
const referenceSlotProps = computed<ReferenceSlotProps>(() => ({
  breadcrumb: items.value?.titles.get(hash.value) ?? '',
}))

// Download documents
onMounted(() =>
  downloadEventBus.on(({ filename, format }) => {
    downloadDocument(
      toValue(originalDocument) || toValue(rawSpec) || '',
      filename,
      format,
    )
  }),
)

onUnmounted(() => {
  // Remove window scroll listener
  window.removeEventListener('scroll', debouncedScroll)
  downloadEventBus.reset()
})

/**
 * Due to a bug in headless UI, we need to set an ID here that can be shared across server/client
 * TODO remove this once the bug is fixed
 *
 * @see https://github.com/tailwindlabs/headlessui/issues/2979
 */
provideUseId(() => useId())
// Provide the client layout
provide(LAYOUT_SYMBOL, 'modal')

// Provide the configuration
provide(CONFIGURATION_SYMBOL, configuration)

provide(
  PLUGIN_MANAGER_SYMBOL,
  createPluginManager({
    plugins: configuration.value.plugins,
  }),
)

const themeStyleTag = computed(
  () => `<style>
  ${getThemeStyles(configuration.value.theme, {
    fonts: configuration.value.withDefaultFonts,
  })}</style>`,
)

// ---------------------------------------------------------------------------
// TODO: Code below is copied from ModernLayout.vue. Find a better location for this.

const { mediaQueries } = useBreakpoints()
const isDevelopment = import.meta.env.MODE === 'development'

watch(mediaQueries.lg, (newValue, oldValue) => {
  // Close the drawer when we go from desktop to mobile
  if (oldValue && !newValue) {
    isSidebarOpen.value = false
  }
})

watch(hash, (newHash, oldHash) => {
  if (newHash && newHash !== oldHash) {
    isSidebarOpen.value = false
  }
})

/** Update the old store to keep it in sync with the new store */
useLegacyStoreEvents(store, workspaceStore, activeEntitiesStore, documentEl)

// ---------------------------------------------------------------------------
</script>
<template>
  <div v-html="themeStyleTag" />
  <div class="temp-header scalar-app">
    <div class="temp-header-container gap-3"></div>
    <div class="temp-header-links">
      <div class="temp-header-link">
        <button class="temp-header-links-button">
          Share
          <ScalarIconCaretDown
            weight="bold"
            class="size-3" />
        </button>
        <div class="temp-header-link-hover temp-header-link-hover-share">
          <div class="temp-header-link-hover-content">
            <label>Temporary Link</label>
            <button class="temp-header-link-hover-content-button">
              Generate
            </button>
            <input placeholder="https://scalar.com/share-hash" />
            <div class="temp-header-link-hover-premium">
              <label>Permanent Link</label>
              <div class="temp-header-link-hover-premium-list">
                <div class="temp-header-link-hover-premium-list-item text-c-2">
                  <ScalarIconLockSimple
                    weight="bold"
                    class="size-3.5" />
                  Password Protected
                </div>
                <div class="temp-header-link-hover-premium-list-item text-c-2">
                  <ScalarIconGlobeSimple
                    weight="bold"
                    class="size-3.5" />
                  Custom Domains
                </div>
                <div class="temp-header-link-hover-premium-list-item text-c-2">
                  <ScalarIconWarningOctagon
                    weight="bold"
                    class="size-3.5" />
                  Spectral Rules
                </div>
                <div class="temp-header-link-hover-premium-list-item text-c-2">
                  <ScalarIconGitBranch
                    weight="bold"
                    class="size-3.5" />
                  Bi-directional Git
                </div>
                <div class="temp-header-link-hover-premium-list-item text-c-2">
                  <ScalarIconFileMd
                    weight="bold"
                    class="size-3.5" />
                  Markdown Files
                </div>
                <div class="temp-header-link-hover-premium-list-item text-c-2">
                  <ScalarIconBracketsCurly
                    weight="bold"
                    class="size-3.5" />
                  Json Schema Support
                </div>
              </div>
              <a
                class="temp-header-link-hover-premium-link-button"
                target="_blank"
                >Generate</a
              >
              <p class="text-c-3 mt-2 text-center text-base leading-[1.55]">
                Uploading links to Scalar Registry, is part of Scalar's Premium
                features. Explore all features on our
                <a
                  href="https://guides.scalar.com/"
                  class="hover:text-c-1 underline"
                  target="_blank"
                  >guides</a
                >.
              </p>
            </div>
          </div>
          <div class="temp-header-link-hover-info">
            <ScalarIconInfo class="size-3.5" /> "Share" will only appear on
            Localhost
          </div>
        </div>
      </div>
      <div class="temp-header-link">
        <button class="temp-header-links-button">
          Generate SDKs
          <ScalarIconCaretDown
            weight="bold"
            class="size-3" />
        </button>
        <div class="temp-header-link-hover">
          <div class="temp-header-link-hover-content flex gap-4">
            <div class="temp-header-link-hover-content-half">
              <label>SDK Previews</label>
            </div>
            <div class="temp-header-link-hover-content-half">
              <label>Select Languages</label>
              <div class="temp-header-link-hover-languages">
                <div class="temp-header-link-hover-language">
                  <svg
                    viewBox="0 0 150 150"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="**:fill-c-1 size-4 **:transition-[fill]">
                    <path
                      d="M74.2285 1.32866C68.144 1.35693 62.3334 1.87585 57.2207 2.78054C42.1594 5.44138 39.4248 11.0108 39.4248 21.2816V34.8464H75.0166V39.3679H39.4248H26.0675C15.7235 39.3679 6.66606 45.5853 3.833 57.4127C0.565098 70.9698 0.420149 79.4296 3.833 93.5853C6.36299 104.122 12.405 111.63 22.7489 111.63H34.9862V95.369C34.9862 83.6214 45.1506 73.259 57.2207 73.259H92.7711C102.667 73.259 110.567 65.111 110.567 55.1727V21.2816C110.567 11.6361 102.43 4.39035 92.7711 2.78054C86.6569 1.76276 80.313 1.30039 74.2285 1.32866ZM54.9807 12.2385C58.6571 12.2385 61.6593 15.2898 61.6593 19.0416C61.6593 22.7801 58.6571 25.8032 54.9807 25.8032C51.2911 25.8032 48.302 22.7801 48.302 19.0416C48.302 15.2898 51.2911 12.2385 54.9807 12.2385Z"
                      fill="#306998"></path>
                    <path
                      d="M115.006 39.3679V55.1727C115.006 67.4259 104.617 77.739 92.771 77.739H57.2207C47.4829 77.739 39.4248 86.0733 39.4248 95.8253V129.716C39.4248 139.362 47.8123 145.035 57.2207 147.803C68.4871 151.115 79.2909 151.714 92.771 147.803C101.731 145.208 110.567 139.987 110.567 129.716V116.152H75.0166V111.63H110.567H128.363C138.707 111.63 142.561 104.415 146.159 93.5853C149.875 82.4363 149.717 71.7148 146.159 57.4127C143.602 47.1152 138.72 39.3679 128.363 39.3679H115.006ZM95.0111 125.195C98.7007 125.195 101.69 128.218 101.69 131.956C101.69 135.708 98.7007 138.76 95.0111 138.76C91.3347 138.76 88.3324 135.708 88.3324 131.956C88.3324 128.218 91.3347 125.195 95.0111 125.195Z"
                      fill="#FFD43B"></path>
                  </svg>
                  Python
                  <button
                    aria-checked="false"
                    aria-disabled="false"
                    class="bg-b-3 relative ml-auto h-3.5 w-6 min-w-6 cursor-pointer rounded-full transition-colors duration-300"
                    role="switch"
                    type="button">
                    <div
                      class="bg-b-1 text-c-accent absolute top-px left-px flex h-3 w-3 items-center justify-center rounded-full transition-transform duration-300"></div>
                    <!---->
                  </button>
                </div>
                <div class="temp-header-link-hover-language">
                  <svg
                    viewBox="0 0 150 150"
                    fill="#00ADD8"
                    xmlns="http://www.w3.org/2000/svg"
                    class="**:fill-c-1 size-4 **:transition-[fill]">
                    <path
                      d="M73.7507 57.7669C67.5474 59.1677 63.3134 60.2184 57.2086 61.6193C55.7316 61.9695 55.6332 62.0571 54.3531 60.7437C52.8762 59.2553 51.7931 58.2922 49.7253 57.4166C43.522 54.7024 37.5157 55.4904 31.9032 58.73C25.2076 62.5824 21.7613 68.2735 21.8598 75.3654C21.9583 82.3699 27.3738 88.1485 35.1525 89.1116C41.8481 89.8996 47.4606 87.7983 51.8915 83.333C52.7777 82.3699 53.5654 81.3192 54.5501 80.0934C51.0053 80.0934 46.5744 80.0934 35.5464 80.0934C33.4786 80.0934 32.9863 78.9552 33.6756 77.4668C34.9556 74.7526 37.3188 70.1997 38.6973 67.9233C38.9927 67.3979 39.6819 66.5224 41.1589 66.5224C46.1806 66.5224 64.6919 66.5224 77 66.5224C76.8031 68.8864 76.8031 71.2504 76.4092 73.6143C75.3261 79.9183 72.6676 85.697 68.3351 90.7752C61.2457 99.0929 51.99 104.259 40.2727 105.66C30.6232 106.798 21.6629 105.134 13.7857 99.8809C6.49932 94.9778 2.36381 88.4987 1.2807 80.4436C0.000655659 70.9001 3.15152 62.3197 9.65019 54.79C16.6412 46.6474 25.8969 41.4816 37.2203 39.6429C46.476 38.1545 55.3378 39.1176 63.3134 43.9331C68.532 46.9976 72.2737 51.2002 74.7353 56.2784C75.3261 57.0664 74.9322 57.5042 73.7507 57.7669Z"></path>
                    <path
                      d="M105.959 105.365C97.0345 105.19 88.8946 102.914 82.0296 97.6614C76.2434 93.1967 72.6148 87.5064 71.438 80.7655C69.6727 70.8731 72.7129 62.1188 79.3817 54.3274C86.5409 45.9232 95.1711 41.5461 106.842 39.7077C116.845 38.1319 126.26 39.0073 134.792 44.1724C142.539 48.8997 147.345 55.2904 148.62 63.6946C150.287 75.5129 146.462 85.1427 137.342 93.3718C130.869 99.2372 122.925 102.914 113.805 104.577C111.157 105.015 108.509 105.103 105.959 105.365ZM129.3 69.9977C129.202 68.8596 129.202 67.9842 129.006 67.1088C127.24 58.442 118.316 53.5395 108.999 55.4655C99.8785 57.3039 93.9943 62.469 91.8367 70.698C90.0714 77.5264 93.7981 84.4424 100.859 87.2438C106.253 89.3448 111.647 89.0822 116.845 86.7185C124.592 83.1292 128.809 77.5264 129.3 69.9977Z"></path></svg
                  >Go<button
                    aria-checked="false"
                    aria-disabled="false"
                    class="bg-b-3 relative ml-auto h-3.5 w-6 min-w-6 cursor-pointer rounded-full transition-colors duration-300"
                    role="switch"
                    type="button">
                    <div
                      class="bg-b-1 text-c-accent absolute top-px left-px flex h-3 w-3 items-center justify-center rounded-full transition-transform duration-300"></div>
                    <!---->
                  </button>
                </div>
                <div
                  class="temp-header-link-hover-language temp-header-link-hover-language-active">
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#3178C6"
                    class="size-4 **:transition-[fill]">
                    <title>TypeScript</title>
                    <path
                      d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"></path>
                  </svg>
                  Typescript
                  <button
                    aria-checked="true"
                    aria-disabled="false"
                    class="bg-c-accent relative ml-auto h-3.5 w-6 min-w-6 cursor-pointer rounded-full transition-colors duration-300"
                    role="switch"
                    type="button">
                    <div
                      class="bg-b-1 text-c-accent absolute top-px left-px flex h-3 w-3 translate-x-2.5 items-center justify-center rounded-full transition-transform duration-300"></div>
                    <!---->
                  </button>
                </div>
                <div class="temp-header-link-hover-language">
                  <svg
                    width="150"
                    height="150"
                    viewBox="0 0 150 150"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    class="**:fill-c-1 size-4 **:transition-[fill]">
                    <g clip-path="url(#clip0_1_26)">
                      <path
                        d="M54.4686 111.282C54.4686 111.282 48.703 114.788 58.4764 115.791C70.242 117.291 76.5092 117.043 89.5311 114.54C92.1482 116.142 94.9161 117.485 97.7952 118.547C68.4983 131.072 31.4248 117.797 54.4686 111.282ZM50.7186 95.0021C50.7186 95.0021 44.4561 99.7599 54.2248 100.768C66.9983 102.019 77.0155 102.268 94.303 98.7662C95.9842 100.471 98.0427 101.757 100.312 102.521C64.9967 113.04 25.4248 103.519 50.7186 95.0021ZM119.845 123.549C119.845 123.549 124.101 127.055 115.087 129.811C98.3061 134.827 44.7092 136.327 29.6811 129.811C24.4217 127.561 34.4389 124.304 37.6498 123.802C40.9077 123.052 42.6655 123.052 42.6655 123.052C36.8998 119.044 4.34515 131.316 26.1373 134.818C85.9967 144.586 135.337 130.561 119.808 123.549H119.845ZM57.178 77.9677C57.178 77.9677 29.878 84.4833 47.4092 86.7333C54.9233 87.7365 69.6983 87.4833 83.4748 86.4849C94.7436 85.4818 106.022 83.4849 106.022 83.4849C106.022 83.4849 102.014 85.238 99.2577 86.9912C71.4608 94.2568 18.1077 90.999 33.3889 83.4849C46.4108 77.2224 57.1827 77.9771 57.1827 77.9771L57.178 77.9677ZM106.022 105.268C134.072 90.7365 121.05 76.7208 112.031 78.4693C109.781 78.9708 108.773 79.4724 108.773 79.4724C108.773 79.4724 109.523 77.9724 111.276 77.4708C129.061 71.2083 143.086 96.2537 105.511 106.018C105.511 106.018 105.759 105.769 106.012 105.268H106.022ZM59.9436 144.84C86.9905 146.593 128.32 143.836 129.319 131.058C129.319 131.058 127.317 136.074 107.03 139.824C83.9858 144.08 55.4342 143.574 38.653 140.827C38.653 140.827 42.1592 143.832 59.9436 144.84Z"
                        fill="#4E7896"></path>
                      <path
                        d="M89.0593 -4.68292C89.0593 -4.68292 104.589 11.0952 74.2843 34.8889C49.989 54.1733 68.7765 65.1936 74.2843 77.7186C60.0062 64.9452 49.7405 53.6718 56.753 43.1577C67.0187 27.6233 95.3218 20.1561 89.0593 -4.68292ZM81.0905 67.1999C88.3562 75.464 79.089 82.978 79.089 82.978C79.089 82.978 97.6234 73.4624 89.1062 61.6874C81.3437 50.4186 75.3249 44.9061 107.889 26.1233C107.889 26.1233 56.5468 38.8968 81.0905 67.1999Z"
                        fill="#F58219"></path>
                    </g>
                    <defs>
                      <clipPath id="clip0_1_26">
                        <rect
                          width="150"
                          height="150"
                          fill="white"></rect>
                      </clipPath>
                    </defs>
                  </svg>
                  Java
                  <button
                    aria-checked="false"
                    aria-disabled="false"
                    class="bg-b-3 relative ml-auto h-3.5 w-6 min-w-6 cursor-pointer rounded-full transition-colors duration-300"
                    role="switch"
                    type="button">
                    <div
                      class="bg-b-1 text-c-accent absolute top-px left-px flex h-3 w-3 items-center justify-center rounded-full transition-transform duration-300"></div>
                    <!---->
                  </button>
                </div>
                <div class="temp-header-link-hover-language">
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#CC342D"
                    class="**:fill-c-1 size-4 **:transition-[fill]">
                    <title>Ruby</title>
                    <path
                      d="M20.156.083c3.033.525 3.893 2.598 3.829 4.77L24 4.822 22.635 22.71 4.89 23.926h.016C3.433 23.864.15 23.729 0 19.139l1.645-3 2.819 6.586.503 1.172 2.805-9.144-.03.007.016-.03 9.255 2.956-1.396-5.431-.99-3.9 8.82-.569-.615-.51L16.5 2.114 20.159.073l-.003.01zM0 19.089zM5.13 5.073c3.561-3.533 8.157-5.621 9.922-3.84 1.762 1.777-.105 6.105-3.673 9.636-3.563 3.532-8.103 5.734-9.864 3.957-1.766-1.777.045-6.217 3.612-9.75l.003-.003z"></path>
                  </svg>
                  Ruby
                  <button
                    aria-checked="false"
                    aria-disabled="false"
                    class="bg-b-3 relative ml-auto h-3.5 w-6 min-w-6 cursor-pointer rounded-full transition-colors duration-300"
                    role="switch"
                    type="button">
                    <div
                      class="bg-b-1 text-c-accent absolute top-px left-px flex h-3 w-3 items-center justify-center rounded-full transition-transform duration-300"></div>
                    <!---->
                  </button>
                </div>
                <div class="temp-header-link-hover-language">
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="#777BB3"
                    class="**:fill-c-1 size-4 **:transition-[fill]">
                    <title>PHP</title>
                    <path
                      d="M7.01 10.207h-.944l-.515 2.648h.838c.556 0 .97-.105 1.242-.314.272-.21.455-.559.55-1.049.092-.47.05-.802-.124-.995-.175-.193-.523-.29-1.047-.29zM12 5.688C5.373 5.688 0 8.514 0 12s5.373 6.313 12 6.313S24 15.486 24 12c0-3.486-5.373-6.312-12-6.312zm-3.26 7.451c-.261.25-.575.438-.917.551-.336.108-.765.164-1.285.164H5.357l-.327 1.681H3.652l1.23-6.326h2.65c.797 0 1.378.209 1.744.628.366.418.476 1.002.33 1.752a2.836 2.836 0 0 1-.305.847c-.143.255-.33.49-.561.703zm4.024.715l.543-2.799c.063-.318.039-.536-.068-.651-.107-.116-.336-.174-.687-.174H11.46l-.704 3.625H9.388l1.23-6.327h1.367l-.327 1.682h1.218c.767 0 1.295.134 1.586.401s.378.7.263 1.299l-.572 2.944h-1.389zm7.597-2.265a2.782 2.782 0 0 1-.305.847c-.143.255-.33.49-.561.703a2.44 2.44 0 0 1-.917.551c-.336.108-.765.164-1.286.164h-1.18l-.327 1.682h-1.378l1.23-6.326h2.649c.797 0 1.378.209 1.744.628.366.417.477 1.001.331 1.751zM17.766 10.207h-.943l-.516 2.648h.838c.557 0 .971-.105 1.242-.314.272-.21.455-.559.551-1.049.092-.47.049-.802-.125-.995s-.524-.29-1.047-.29z"></path>
                  </svg>
                  PHP
                  <button
                    aria-checked="false"
                    aria-disabled="false"
                    class="bg-b-3 relative ml-auto h-3.5 w-6 min-w-6 cursor-pointer rounded-full transition-colors duration-300"
                    role="switch"
                    type="button">
                    <div
                      class="bg-b-1 text-c-accent absolute top-px left-px flex h-3 w-3 items-center justify-center rounded-full transition-transform duration-300"></div>
                    <!---->
                  </button>
                </div>
              </div>
              <a
                class="temp-header-link-hover-premium-link-button"
                target="_blank"
                >Generate</a
              >
              <p class="text-c-3 mt-2 text-center text-base leading-[1.55]">
                Generating SDKs is a paid feature starting at $100/mo, learn
                more here:
                <a
                  href="https://guides.scalar.com/"
                  class="hover:text-c-1 underline"
                  target="_blank"
                  >Scalar SDKs</a
                >.
              </p>
            </div>
          </div>
          <div class="temp-header-link-hover-info">
            <ScalarIconInfo class="size-3.5" /> "Generate SDK's" will only
            appear on Localhost
          </div>
        </div>
      </div>
      <div class="temp-header-link">
        <button class="temp-header-links-button">
          Configure
          <ScalarIconCaretDown
            weight="bold"
            class="size-3" />
        </button>
        <div class="temp-header-link-hover">
          <label>Generate Temporary Share Link</label>
          <input />
          <div class="temp-header-link-hover-callout">yo</div>
        </div>
      </div>
    </div>
  </div>
  <div
    ref="documentEl"
    class="scalar-app scalar-api-reference references-layout"
    :class="[
      {
        'scalar-api-references-standalone-mobile':
          configuration.showSidebar ?? true,
        'scalar-scrollbars-obtrusive': obtrusiveScrollbars,
        'references-editable': configuration.isEditable,
        'references-sidebar': configuration.showSidebar,
        'references-sidebar-mobile-open': isSidebarOpen,
        'references-classic': configuration.layout === 'classic',
      },
      $attrs.class,
    ]"
    :style="{
      '--scalar-y-offset': `var(--scalar-custom-header-height, ${yPosition}px)`,
    }">
    <!-- Header -->
    <div class="references-header">
      <MobileHeader
        :breadcrumb="referenceSlotProps.breadcrumb"
        v-if="
          configuration.layout === 'modern' &&
          (configuration.showSidebar ?? true)
        " />
      <slot
        v-bind="referenceSlotProps"
        name="header" />
    </div>
    <!-- Navigation (sidebar) wrapper -->
    <aside
      v-if="configuration.showSidebar"
      :aria-label="`Sidebar for ${dereferencedDocument?.info?.title}`"
      class="references-navigation t-doc__sidebar">
      <!-- Navigation tree / Table of Contents -->
      <div class="references-navigation-list">
        <ScalarErrorBoundary>
          <!-- TODO: @brynn should this be conditional based on classic/modern layout? -->
          <Sidebar
            :title="dereferencedDocument?.info?.title ?? 'The OpenAPI Schema'">
            <template #sidebar-start>
              <!-- Wrap in a div when slot is filled -->
              <div v-if="$slots['document-selector']">
                <slot name="document-selector" />
              </div>
              <!-- Search -->
              <div
                v-if="!configuration.hideSearch"
                class="scalar-api-references-standalone-search">
                <SearchButton
                  :searchHotKey="configuration?.searchHotKey"
                  :hideModels="configuration?.hideModels" />
              </div>
              <!-- Sidebar Start -->
              <slot
                name="sidebar-start"
                v-bind="referenceSlotProps" />
            </template>
            <template #sidebar-end>
              <slot
                v-bind="referenceSlotProps"
                name="sidebar-end">
                <ScalarSidebarFooter class="darklight-reference">
                  <OpenApiClientButton
                    v-if="!configuration.hideClientButton"
                    buttonSource="sidebar"
                    :integration="configuration._integration"
                    :isDevelopment="isDevelopment"
                    :url="configuration.url" />
                  <!-- Override the dark mode toggle slot to hide it -->
                  <template #toggle>
                    <ScalarColorModeToggleButton
                      v-if="!configuration.hideDarkModeToggle"
                      :modelValue="isDark"
                      @update:modelValue="$emit('toggleDarkMode')" />
                    <span v-else />
                  </template>
                </ScalarSidebarFooter>
              </slot>
            </template>
          </Sidebar>
        </ScalarErrorBoundary>
      </div>
    </aside>
    <!-- Slot for an Editor -->
    <div
      v-show="configuration.isEditable"
      class="references-editor">
      <div class="references-editor-textarea">
        <slot
          v-bind="referenceSlotProps"
          name="editor" />
      </div>
    </div>
    <!-- The Content -->
    <template v-if="showRenderedContent">
      <main
        :aria-label="`Open API Documentation for ${dereferencedDocument?.info?.title}`"
        class="references-rendered">
        <Content
          :document="dereferencedDocument"
          :config="configuration"
          :store="store">
          <template #start>
            <slot
              v-bind="referenceSlotProps"
              name="content-start">
              <ClassicHeader v-if="configuration.layout === 'classic'">
                <div
                  v-if="$slots['document-selector']"
                  class="w-64 *:!p-0 empty:hidden">
                  <slot name="document-selector" />
                </div>
                <SearchButton
                  v-if="!configuration.hideSearch"
                  class="t-doc__sidebar max-w-64"
                  :searchHotKey="configuration.searchHotKey"
                  :hideModels="configuration?.hideModels" />
                <template #dark-mode-toggle>
                  <ScalarColorModeToggleIcon
                    v-if="!configuration.hideDarkModeToggle"
                    class="text-c-2 hover:text-c-1"
                    :mode="isDark ? 'dark' : 'light'"
                    style="transform: scale(1.4)"
                    variant="icon"
                    @click="$emit('toggleDarkMode')" />
                </template>
              </ClassicHeader>
            </slot>
          </template>
          <template
            v-if="configuration?.isEditable"
            #empty-state>
            <GettingStarted
              :theme="configuration?.theme || 'default'"
              @changeTheme="$emit('changeTheme', $event)"
              @linkSwaggerFile="$emit('linkSwaggerFile')"
              @loadSwaggerFile="$emit('loadSwaggerFile')"
              @updateContent="$emit('updateContent', $event)" />
          </template>
          <template #end>
            <slot
              v-bind="referenceSlotProps"
              name="content-end" />
          </template>
        </Content>
      </main>
      <div
        v-if="$slots.footer"
        class="references-footer">
        <slot
          v-bind="referenceSlotProps"
          name="footer" />
      </div>
    </template>
    <ApiClientModal
      :configuration="configuration"
      :dereferencedDocument="dereferencedDocument" />
  </div>
  <ScalarToasts />
</template>
<style>
@import '@/style.css';

/** Used to check if css is loaded */
:root {
  --scalar-loaded-api-reference: true;
}
</style>
<style scoped>
/* Configurable Layout Variables */
@layer scalar-config {
  .scalar-api-reference {
    --refs-sidebar-width: var(--scalar-sidebar-width, 0px);
    --refs-header-height: calc(
      var(--scalar-y-offset) + var(--scalar-header-height, 0px)
    );
    --refs-content-max-width: var(--scalar-content-max-width, 1540px);
  }

  .scalar-api-reference.references-classic {
    /* Classic layout is wider */
    --refs-content-max-width: var(--scalar-content-max-width, 1420px);
    min-height: 100dvh;
    --refs-sidebar-width: 0;
  }
}

/* ----------------------------------------------------- */
/* References Layout */
.references-layout {
  /* Try to fill the container */
  min-height: 100dvh;
  min-width: 100%;
  max-width: 100%;
  flex: 1;

  /*
  Calculated by a resize observer and set in the style attribute
  Falls back to the viewport height
  */
  --full-height: 100dvh;

  /* Grid layout */
  display: grid;
  grid-template-rows: var(--scalar-header-height, 0px) repeat(2, auto);
  grid-template-columns: var(--refs-sidebar-width) 1fr;
  grid-template-areas:
    'header header'
    'navigation rendered'
    'footer footer';

  background: var(--scalar-background-1);
}

.references-header {
  grid-area: header;
  position: sticky;
  top: var(--scalar-custom-header-height, 0px);
  z-index: 1000;

  height: var(--scalar-header-height, 0px);
}

.references-editor {
  grid-area: editor;
  display: flex;
  min-width: 0;
  background: var(--scalar-background-1);
}

.references-navigation {
  grid-area: navigation;
}

.references-rendered {
  position: relative;
  grid-area: rendered;
  min-width: 0;
  background: var(--scalar-background-1);
}
.scalar-api-reference.references-classic,
.references-classic .references-rendered {
  height: initial !important;
  max-height: initial !important;
}
.references-navigation-list {
  position: sticky;
  top: var(--refs-header-height);
  height: calc(100dvh - var(--refs-header-height));
  background: var(--scalar-sidebar-background-1, var(--scalar-background-1));
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Fix the editor in the middle while allowing the rest of the view to scroll */
.references-editor-textarea {
  position: sticky;
  top: var(--refs-header-height);
  height: calc(var(--full-height) - var(--refs-header-height));
  display: flex;
  min-width: 0;
  flex: 1;
}

.references-editable {
  grid-template-columns: var(--refs-sidebar-width) 1fr 1fr;

  grid-template-areas:
    'header header header'
    'navigation editor rendered'
    'footer footer footer';
}
@layer scalar-config {
  .references-sidebar {
    /* Set a default width if references are enabled */
    --refs-sidebar-width: var(--scalar-sidebar-width, 280px);
  }
}

/* Footer */
.references-footer {
  grid-area: footer;
}
/* ----------------------------------------------------- */
/* Responsive / Mobile Layout */

@media (max-width: 1150px) {
  /* Hide rendered view for tablets */
  .references-layout {
    grid-template-columns: var(--refs-sidebar-width) 1fr 0px;
  }
}

@media (max-width: 1000px) {
  /* Stack view on mobile */
  .references-layout {
    grid-template-columns: auto;
    grid-template-rows: var(--scalar-header-height, 0px) 0px auto auto;

    grid-template-areas:
      'header'
      'navigation'
      'rendered'
      'footer';
  }
  .references-editable {
    grid-template-areas:
      'header'
      'navigation'
      'editor';
  }

  .references-navigation,
  .references-rendered {
    max-height: unset;
  }

  .references-rendered {
    position: static;
  }

  .references-navigation {
    display: none;
    z-index: 10;
  }

  .references-sidebar-mobile-open .references-navigation {
    display: block;
    top: var(--refs-header-height);
    height: calc(100dvh - var(--refs-header-height));
    width: 100%;
    position: sticky;
  }

  .references-navigation-list {
    position: absolute;

    /* Offset by 1px to avoid gap */
    top: -1px;

    /* Add a pixel to cover the bottom of the viewport */
    height: calc(var(--full-height) - var(--refs-header-height) + 1px);
    width: 100%;

    border-top: 1px solid var(--scalar-border-color);
    display: flex;
    flex-direction: column;
  }
}
</style>
<style scoped>
/**
* Sidebar CSS for standalone
* TODO: @brynn move this to the sidebar block OR the ApiReferenceStandalone component
* when the new elements are available
*/
@media (max-width: 1000px) {
  .scalar-api-references-standalone-mobile {
    --scalar-header-height: 50px;
  }
}
</style>
<style scoped>
.scalar-api-references-standalone-search {
  display: flex;
  flex-direction: column;
  padding: 12px 12px 6px 12px;
}
.darklight-reference {
  width: 100%;
  margin-top: auto;
}
:root {
  --scalar-custom-header-height: 48px;
}
.temp-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  height: 48px;
  background: var(--scalar-background-1);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  display: flex;
  align-items: center;
  padding: 0 12px;
  justify-content: space-between;
}
.temp-header-container {
  display: flex;
  align-items: center;
  gap: 8px;
}
.temp-header-links {
  display: flex;
  gap: 4px;
}
.temp-header-links-button {
  font-size: var(--scalar-small);
  appearance: none;
  border: none;
  background: none;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--scalar-radius);
  color: var(--scalar-color-2);
  font-family: var(--scalar-font);
  display: flex;
  align-items: center;
  gap: 4px;
}
.temp-header-links-button svg {
  transition: transform 0.2s ease-in-out;
}
.temp-header-links-button:hover svg {
  transform: rotate(180deg);
  transition: transform 0.2s ease-in-out;
}
.temp-header-links-button:hover {
  background: var(--scalar-background-2);
  color: var(--scalar-color-1);
}
.temp-header-link {
  position: relative;
}
.temp-header-link-hover {
  position: absolute;
  background: var(--scalar-background-1);
  z-index: 10;
  box-shadow: var(--scalar-shadow-2);
  width: 720px;
  right: 0;
  border-radius: var(--scalar-radius-xl);
  opacity: 0;
  pointer-events: none;
  transform: translateY(5px);
  transition: all 0.2s ease-in-out;
  background: var(--scalar-background-2);
  overflow: hidden;
}
.temp-header-link-hover-share {
  width: 440px;
}
.temp-header-link:hover .temp-header-link-hover {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.temp-header-link-hover-info {
  padding: 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-2);
}
.temp-header-link-hover-content {
  background: var(--scalar-background-1);
  border-bottom-left-radius: var(--scalar-radius-lg);
  border-bottom-right-radius: var(--scalar-radius-lg);
  padding: 30px 30px 24px 30px;
}
.temp-header-link-hover-content label {
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-1);
  margin-bottom: 12px;
  display: block;
  font-weight: var(--scalar-semibold);
}
button.temp-header-link-hover-content-button {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  width: 100%;
  text-align: center;
  display: flex;
  padding: 8px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
}
.temp-header-link-hover-content input {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  width: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-1);
  font-family: var(--scalar-font);
  margin-top: 6px;
}
.temp-header-link-hover-premium {
  margin-top: 30px;
}
.temp-header-link-hover-premium-list {
  display: flex;
  gap: 6px;
  flex-flow: wrap;
}
.temp-header-link-hover-premium-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--scalar-font-size-3);
  margin-top: 6px;
  font-weight: var(--scalar-semibold);
  width: calc(50% - 6px);
}
.temp-header-link-hover-premium-link-button {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  width: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--scalar-button-1);
  color: var(--scalar-button-1-color);
  font-weight: var(--scalar-semibold);
  font-size: var(--scalar-font-size-3);
  padding: 8px;
  display: block;
  margin-top: 18px;
  cursor: pointer;
}
.temp-header-link-hover-premium-link-button:hover {
  background: var(--scalar-button-1-hover);
}
.temp-header-link-hover-content-half {
  width: 50%;
}
.temp-header-link-hover-language {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 8px;
  gap: 8px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
  background: color-mix(
    in srgb,
    var(--scalar-background-1),
    var(--scalar-background-2)
  );
}
.temp-header-link-hover-language-active {
  background: var(--scalar-background-1);
}
.temp-header-link-hover-language:last-child {
  border-bottom: none;
}
.temp-header-link-hover-languages {
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  border-radius: var(--scalar-radius-lg);
  overflow: hidden;
}
</style>
