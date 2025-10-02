<script setup lang="ts">
import { provideUseId } from '@headlessui/vue'
import { LAYOUT_SYMBOL } from '@scalar/api-client/hooks'
import {
  ACTIVE_ENTITIES_SYMBOL,
  WORKSPACE_SYMBOL,
} from '@scalar/api-client/store'
import { addScalarClassesToHeadless } from '@scalar/components'
import { sleep } from '@scalar/helpers/testing/sleep'
import { type ThemeId } from '@scalar/themes'
import { useBreakpoints } from '@scalar/use-hooks/useBreakpoints'
import { ScalarToasts } from '@scalar/use-toasts'
import { useDebounceFn, useResizeObserver } from '@vueuse/core'
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

import { Content } from '@/components/Content'
import { hasLazyLoaded } from '@/components/Lazy/lazyBus'
import { ApiClientModal } from '@/features/api-client-modal'
import { useDocumentSource } from '@/features/document-source'
import { useNavState } from '@/hooks/useNavState'
import { createPluginManager, PLUGIN_MANAGER_SYMBOL } from '@/plugins'
import type {
  ReferenceLayoutProps,
  ReferenceLayoutSlot,
  ReferenceSlotProps,
} from '@/types'
import { useSidebar } from '@/v2/blocks/scalar-sidebar-block'
import { useLegacyStoreEvents } from '@/v2/hooks/use-legacy-store-events'

// ---------------------------------------------------------------------------
// Vue Macros

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

defineOptions({
  inheritAttrs: false,
})

defineSlots<
  {
    [x in ReferenceLayoutSlot]: (props: ReferenceSlotProps) => any
  } & { 'document-selector': any }
>()

/**
 * For unknown reasons the configuration does not perform reactively without this wrapper
 */
/**
 * For unknown reasons the configuration does not perform reactively without this wrapper
 */
const configuration = computed(() => ({
  ...providedConfiguration,
  hideClientButton: providedConfiguration.hideClientButton ?? false,
  showSidebar: providedConfiguration.showSidebar ?? true,
  theme: providedConfiguration.theme ?? 'none',
  layout: providedConfiguration.layout ?? 'modern',
  persistAuth: providedConfiguration.persistAuth ?? false,
  documentDownloadType: providedConfiguration.documentDownloadType ?? 'both',
  onBeforeRequest: providedConfiguration.onBeforeRequest,
}))

// ---------------------------------------------------------------------------
// Date injection for global state

/** @deprecated Old method of document loading. Move to workspace store and async addDocument */
const { dereferencedDocument, workspaceStore, activeEntitiesStore } =
  useDocumentSource({
    configuration,
    dereferencedDocument: providedDereferencedDocument,
    originalDocument: providedOriginalDocument,
  })

/** @deprecated Injected to provision api-client */
provide(WORKSPACE_SYMBOL, workspaceStore)

/** @deprecated Injected to provision api-client */
provide(ACTIVE_ENTITIES_SYMBOL, activeEntitiesStore)

/**
 * Due to a bug in headless UI, we need to set an ID here that can be shared across server/client
 * TODO remove this once the bug is fixed
 *
 * @see https://github.com/tailwindlabs/headlessui/issues/2979
 */
provideUseId(() => useId())
// Provide the client layout
provide(LAYOUT_SYMBOL, 'modal')

provide(
  PLUGIN_MANAGER_SYMBOL,
  createPluginManager({
    plugins: configuration.value.plugins,
  }),
)

// ---------------------------------------------------------------------------
// Sync sidebar to active document

const { isSidebarOpen, setCollapsedSidebarItem, scrollToOperation, items } =
  useSidebar(store)

/** Id of the first entry should be the  */
const contentId = computed(() => items.value.entries[0]?.id ?? '')

const {
  getReferenceId,
  getPathRoutingId,
  hash,
  isIntersectionEnabled,
  updateHash,
  replaceUrlState,
} = useNavState()

// ---------------------------------------------------------------------------
// Scroll management

/** TODO: Comment this var */
const yPosition = ref(0)

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

// To clear hash when scrolled to the top
const debouncedScroll = useDebounceFn(() => {
  if (window.scrollY < 50 && hasLazyLoaded.value) {
    replaceUrlState('')
  }
})

onUnmounted(() => {
  // Remove window scroll listener
  window.removeEventListener('scroll', debouncedScroll)
})

// Open a sidebar tag
watch(
  () => store.workspace.activeDocument,
  () => {
    // Scroll to given hash
    if (hash.value) {
      const entry = items.value.entities.get(hash.value)
      const hashSectionId = entry?.parent?.id ?? entry?.id
      if (hashSectionId) {
        setCollapsedSidebarItem(hashSectionId, true)
      }
    }
    // Open the first tag if no hash is present
    else {
      const firstTag = items.value.entries.find((item) => item.type === 'tag')
      if (firstTag) {
        setCollapsedSidebarItem(firstTag.id, true)
      }
    }
  },
)

// ---------------------------------------------------------------------------

// Track the container height to control the sidebar height
const elementHeight = ref('100dvh')
const documentEl = ref<HTMLElement | null>(null)
useResizeObserver(documentEl, (entries) => {
  elementHeight.value = entries[0]
    ? entries[0].contentRect.height + 'px'
    : '100dvh'
})

// ---------------------------------------------------------------------------
// TODO: Code below is copied from ModernLayout.vue. Find a better location for this.

const { mediaQueries } = useBreakpoints()

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
  <main
    :aria-label="`Open API Documentation for ${dereferencedDocument?.info?.title}`"
    class="references-rendered">
    <Content
      :contentId="contentId"
      :options="{
        isLoading: configuration.isLoading,
        slug: configuration.slug,
        hiddenClients: configuration.hiddenClients,
        layout: configuration.layout,
        onLoaded: configuration.onLoaded,
        persistAuth: configuration.persistAuth,
        showOperationId: configuration.showOperationId,
        hideTestRequestButton: configuration.hideTestRequestButton,
        expandAllResponses: configuration.expandAllResponses,
        hideModels: configuration.hideModels,
        expandAllModelSections: configuration.expandAllModelSections,
        orderRequiredPropertiesFirst:
          configuration.orderRequiredPropertiesFirst,
        orderSchemaPropertiesBy: configuration.orderSchemaPropertiesBy,
        documentDownloadType: configuration.documentDownloadType,
        url: configuration.url,
        onShowMore: configuration.onShowMore,
      }"
      :store="store">
    </Content>
  </main>

  <ApiClientModal
    :configuration="configuration"
    :dereferencedDocument="dereferencedDocument" />

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
    /* The header height */
    --refs-header-height: calc(
      var(--scalar-y-offset) + var(--scalar-header-height, 0px)
    );
    /* The offset of visible references content (minus headers) */
    --refs-viewport-offset: calc(
      var(--refs-header-height, 0px) + var(--refs-content-offset, 0px)
    );
    /* The calculated height of visible references content (minus headers) */
    --refs-viewport-height: calc(
      var(--full-height, 100dvh) - var(--refs-viewport-offset, 0px)
    );
    --refs-content-max-width: var(--scalar-content-max-width, 1540px);
  }

  .scalar-api-reference.references-classic {
    /* Classic layout is wider */
    --refs-content-max-width: var(--scalar-content-max-width, 1420px);
    min-height: 100dvh;
    --refs-sidebar-width: 0;
  }

  /* When the toolbar is present, we need to offset the content */
  .scalar-api-reference:has(.api-reference-toolbar) {
    --refs-content-offset: 48px;
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
