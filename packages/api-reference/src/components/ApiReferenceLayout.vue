<script setup lang="ts">
import { provideUseId } from '@headlessui/vue'
import { LAYOUT_SYMBOL } from '@scalar/api-client/hooks'
import {
  ACTIVE_ENTITIES_SYMBOL,
  WORKSPACE_SYMBOL,
} from '@scalar/api-client/store'
import {
  addScalarClassesToHeadless,
  ScalarErrorBoundary,
} from '@scalar/components'
import { defaultStateFactory } from '@scalar/oas-utils/helpers'
import {
  getThemeStyles,
  hasObtrusiveScrollbars,
  type ThemeId,
} from '@scalar/themes'
import {
  apiReferenceConfigurationSchema,
  type ApiReferenceConfiguration,
} from '@scalar/types/api-reference'
import type { SSRState } from '@scalar/types/legacy'
import { ScalarToasts, useToasts } from '@scalar/use-toasts'
import { useDebounceFn, useMediaQuery, useResizeObserver } from '@vueuse/core'
import {
  computed,
  onBeforeMount,
  onMounted,
  onServerPrefetch,
  onUnmounted,
  provide,
  ref,
  toRef,
  toValue,
  useId,
  useSSRContext,
  watch,
} from 'vue'

import { Content } from '@/components/Content'
import GettingStarted from '@/components/GettingStarted.vue'
import { Sidebar } from '@/components/Sidebar'
import { ApiClientModal } from '@/features/ApiClientModal'
import { useDataSource } from '@/features/DataProvider'
import { sleep } from '@/helpers/sleep'
import { CONFIGURATION_SYMBOL } from '@/hooks/useConfig'
import { useNavState } from '@/hooks/useNavState'
import { useSidebar } from '@/hooks/useSidebar'
import { downloadDocument, downloadEventBus } from '@/libs/download'
import { createPluginManager, PLUGIN_MANAGER_SYMBOL } from '@/plugins'
import { useHttpClientStore } from '@/stores/useHttpClientStore'
import type {
  ReferenceLayoutProps,
  ReferenceLayoutSlot,
  ReferenceSlotProps,
} from '@/types'

const {
  rawSpec,
  configuration: providedConfiguration,
  originalDocument: providedOriginalDocument,
  dereferencedDocument: providedDereferencedDocument,
} = defineProps<Omit<ReferenceLayoutProps, 'isDark'>>()

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

const {
  originalDocument,
  dereferencedDocument,
  parsedDocument,
  workspaceStore,
  activeEntitiesStore,
} = useDataSource({
  configuration,
  dereferencedDocument: providedDereferencedDocument,
  originalDocument: providedOriginalDocument,
})

provide(WORKSPACE_SYMBOL, workspaceStore)
provide(ACTIVE_ENTITIES_SYMBOL, activeEntitiesStore)

defineSlots<{
  [x in ReferenceLayoutSlot]: (props: ReferenceSlotProps) => any
}>()

const isLargeScreen = useMediaQuery('(min-width: 1150px)')

// Track the container height to control the sidebar height
const elementHeight = ref('100dvh')
const documentEl = ref<HTMLElement | null>(null)
useResizeObserver(documentEl, (entries) => {
  elementHeight.value = entries[0].contentRect.height + 'px'
})

// Check for Obtrusive Scrollbars
const obtrusiveScrollbars = computed(hasObtrusiveScrollbars)

const {
  breadcrumb,
  collapsedSidebarItems,
  isSidebarOpen,
  setCollapsedSidebarItem,
  hideModels,
  defaultOpenAllTags,
  // setParsedSpec,
  scrollToOperation,
} = useSidebar()

const {
  getReferenceId,
  getPathRoutingId,
  getSectionId,
  getTagId,
  hash,
  isIntersectionEnabled,
  updateHash,
  replaceUrlState,
} = useNavState(configuration)

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

// Ideally this triggers absolutely first on the client so we can set hash value
onBeforeMount(() => updateHash())

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

/**
 * Ensure we add our scalar wrapper class to the headless ui root
 * mounted is too late
 */
onBeforeMount(() => addScalarClassesToHeadless())

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
})

const showRenderedContent = computed(
  () => isLargeScreen.value || !configuration.value.isEditable,
)

// To clear hash when scrolled to the top
const debouncedScroll = useDebounceFn((value) => {
  const scrollDistance = value.target.scrollTop ?? 0
  if (scrollDistance < 50) {
    const basePath = configuration.value.pathRouting
      ? configuration.value.pathRouting.basePath
      : window.location.pathname

    replaceUrlState('', basePath + window.location.search)
  }
})

/** This is passed into all of the slots so they have access to the references data */
const referenceSlotProps = computed<ReferenceSlotProps>(() => ({
  breadcrumb: breadcrumb.value,
  spec: parsedDocument.value,
}))

// Download documents
onMounted(() =>
  downloadEventBus.on(({ filename }) => {
    downloadDocument(
      toValue(originalDocument) || toValue(rawSpec) || '',
      filename,
    )
  }),
)

onUnmounted(() => downloadEventBus.reset())

// Initialize the server state
onServerPrefetch(() => {
  const ctx = useSSRContext<SSRState>()

  if (!ctx) {
    return
  }

  ctx.payload ||= { data: defaultStateFactory() }
  ctx.payload.data ||= defaultStateFactory()

  // Set initial hash value
  if (configuration.value.pathRouting) {
    const id = getPathRoutingId(ctx.url)
    hash.value = id
    ctx.payload.data.hash = id

    // For sidebar items we need to reset the state as it persists between requests
    // This is a temp hack, need to come up with a better solution
    for (const key in collapsedSidebarItems) {
      if (Object.hasOwn(collapsedSidebarItems, key)) {
        delete collapsedSidebarItems[key]
      }
    }

    if (id) {
      setCollapsedSidebarItem(getSectionId(id), true)
    } else {
      const firstTag = parsedDocument.value.tags?.[0]

      if (firstTag) {
        setCollapsedSidebarItem(getTagId(firstTag), true)
      }
    }

    ctx.payload.data['useSidebarContent-collapsedSidebarItems'] =
      collapsedSidebarItems
  }
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

/** Helper utility to map configuration props to the ApiReference internal state */
function mapConfigToState<K extends keyof ApiReferenceConfiguration>(
  key: K,
  setter: (val: NonNullable<ApiReferenceConfiguration[K]>) => any,
) {
  watch(
    () => configuration.value[key],
    (newValue) => {
      if (typeof newValue !== 'undefined') {
        setter(newValue)
      }
    },
    { immediate: true },
  )
}

// Hides any client snippets from the references
const { setExcludedClients, setDefaultHttpClient } = useHttpClientStore()
mapConfigToState('defaultHttpClient', setDefaultHttpClient)
mapConfigToState('hiddenClients', setExcludedClients)

hideModels.value = configuration.value.hideModels ?? false
defaultOpenAllTags.value = configuration.value.defaultOpenAllTags ?? false

const themeStyleTag = computed(
  () => `<style>
  ${getThemeStyles(configuration.value.theme, {
    fonts: configuration.value.withDefaultFonts,
  })}</style>`,
)
</script>
<template>
  <div v-html="themeStyleTag" />
  <div
    ref="documentEl"
    class="scalar-app scalar-api-reference references-layout"
    :class="[
      {
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
    }"
    @scroll.passive="debouncedScroll">
    <div>deref:{{ !!dereferencedDocument }}</div>
    <!-- Header -->
    <div class="references-header">
      <slot
        v-bind="{ ...referenceSlotProps }"
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
          <Sidebar
            :operationsSorter="configuration.operationsSorter"
            :parsedSpec="parsedDocument"
            :tagsSorter="configuration.tagsSorter">
            <template #sidebar-start>
              <slot
                v-bind="{ ...referenceSlotProps }"
                name="sidebar-start" />
            </template>
            <template #sidebar-end>
              <slot
                v-bind="{ ...referenceSlotProps }"
                name="sidebar-end" />
            </template>
          </Sidebar>
        </ScalarErrorBoundary>
      </div>
    </aside>
    <!-- Swagger file editing -->
    <div
      v-show="configuration.isEditable"
      class="references-editor">
      <div class="references-editor-textarea">
        <slot
          v-bind="{ ...referenceSlotProps }"
          name="editor" />
      </div>
    </div>
    <!-- Rendered reference -->
    <template v-if="showRenderedContent">
      <main
        :aria-label="`Open API Documentation for ${dereferencedDocument?.info?.title}`"
        class="references-rendered">
        <Content
          :layout="configuration.layout"
          :parsedSpec="parsedDocument">
          <template #start>
            <slot
              v-bind="{ ...referenceSlotProps }"
              name="content-start" />
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
              v-bind="{ ...referenceSlotProps }"
              name="content-end" />
          </template>
        </Content>
      </main>
      <div
        v-if="$slots.footer"
        class="references-footer">
        <slot
          v-bind="{ ...referenceSlotProps }"
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
@import '@scalar/components/style.css';
@import '@scalar/themes/style.css';
@import '../assets/tailwind.css';
@import '@scalar/api-client/style.css';

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
  z-index: 10;

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
  --full-height: fit-content !important;
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
