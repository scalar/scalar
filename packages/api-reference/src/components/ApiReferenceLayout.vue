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
import { SearchButton } from '@/features/Search'
import { Sidebar, useSidebar } from '@/features/sidebar'
import { CONFIGURATION_SYMBOL } from '@/hooks/useConfig'
import { useNavState } from '@/hooks/useNavState'
import { createPluginManager, PLUGIN_MANAGER_SYMBOL } from '@/plugins'
import type {
  ReferenceLayoutProps,
  ReferenceLayoutSlot,
  ReferenceSlotProps,
} from '@/types'
import { useLegacyStoreEvents } from '@/v2/hooks/use-legacy-store-events'

const {
  configuration: providedConfiguration,
  originalDocument: providedOriginalDocument,
  dereferencedDocument: providedDereferencedDocument,
  store,
} = defineProps<ReferenceLayoutProps>()

defineEmits<{
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

const { dereferencedDocument, workspaceStore, activeEntitiesStore } =
  useDocumentSource({
    configuration,
    dereferencedDocument: providedDereferencedDocument,
    originalDocument: providedOriginalDocument,
  })

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
  // Open the first tag if there are tags defined
  else if (newDoc.tags?.length) {
    const firstTag = newDoc.tags?.[0]

    if (firstTag) {
      setCollapsedSidebarItem(getTagId(firstTag), true)
    }
  }
  // If there's no tags defined on the document, grab the first tag entry
  else {
    const firstTag = items.value.entries.find((item) => 'tag' in item)
    if (firstTag) {
      setCollapsedSidebarItem(firstTag.id, true)
    }
  }

  // Open the sidebar
  sidebarOpened.value = true
})

/** This is passed into all of the slots so they have access to the references data */
const referenceSlotProps = computed<ReferenceSlotProps>(() => ({
  breadcrumb: items.value?.titles.get(hash.value) ?? '',
}))

onUnmounted(() => {
  // Remove window scroll listener
  window.removeEventListener('scroll', debouncedScroll)
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
        v-if="
          configuration.layout === 'modern' &&
          (configuration.showSidebar ?? true)
        "
        :breadcrumb="referenceSlotProps.breadcrumb" />
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
                  :hideModels="configuration?.hideModels"
                  :searchHotKey="configuration?.searchHotKey" />
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
          :config="configuration"
          :store="store">
          <template #start>
            <slot
              v-bind="referenceSlotProps"
              name="content-start" />
            <ClassicHeader v-if="configuration.layout === 'classic'">
              <div
                v-if="$slots['document-selector']"
                class="w-64 *:!p-0 empty:hidden">
                <slot name="document-selector" />
              </div>
              <SearchButton
                v-if="!configuration.hideSearch"
                class="t-doc__sidebar max-w-64"
                :hideModels="configuration?.hideModels"
                :searchHotKey="configuration.searchHotKey" />
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
</style>
