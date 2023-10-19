<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { type ThemeId, ThemeStyles } from '@scalar/themes'
import { FlowToastContainer } from '@scalar/use-toasts'
import { useMediaQuery, useResizeObserver } from '@vueuse/core'
import {
  computed,
  defineAsyncComponent,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue'

import { getTagSectionId } from '../helpers'
import { useTemplateStore } from '../stores/template'
import type { ReferenceProps, Spec } from '../types'
import { default as ApiClientModal } from './ApiClientModal.vue'
import { Content } from './Content'
import MobileHeader from './MobileHeader.vue'
import SearchModal from './SearchModal.vue'
import Sidebar from './Sidebar.vue'

const props = withDefaults(defineProps<ReferenceProps>(), {
  showSidebar: true,
  isEditable: false,
  theme: 'default',
})

defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
}>()

/**
 * The editor component has heavy dependencies (process), let's lazy load it.
 */
const LazyLoadedSwaggerEditor = defineAsyncComponent(() =>
  import('@scalar/swagger-editor').then((module) => module.SwaggerEditor),
)

const specRef = ref<string>(props.spec ?? '')

watch(
  () => props.spec,
  () => {
    if (props.spec) {
      specRef.value = props.spec
    }
  },
  { immediate: true },
)

const fetchSpecUrl = () => {
  if (props.specUrl === undefined || props.specUrl.length === 0) {
    return
  }

  fetch(props.specUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error('The provided OpenAPI/Swagger spec URL is invalid.')
      }

      return response.text()
    })
    .then((data) => {
      specRef.value = data
    })
    .catch((error) => {
      console.log(
        'Could not fetch the OpenAPI/Swagger Spec file:',
        error.message,
      )
    })
}

const isLargeScreen = useMediaQuery('(min-width: 1150px)')
const isMobile = useMediaQuery('(max-width: 1000px)')

// Track the container height to control the sidebar height
const elementHeight = ref(0)
const documentEl = ref<HTMLElement | null>(null)
useResizeObserver(documentEl, (entries) => {
  elementHeight.value = entries[0].contentRect.height
})

const { toggleCollapsedSidebarItem } = useTemplateStore()
const { state, setActiveSidebar } = useApiClientStore()

const showMobileDrawer = computed(() => {
  const { state: s } = useTemplateStore()
  return s.showMobileDrawer
})

// Handle content updates
const transformedSpec = reactive<Spec>({
  info: {
    title: '',
    description: '',
    termsOfService: '',
    version: '',
    license: {
      name: '',
      url: '',
    },
    contact: {
      email: '',
    },
  },
  externalDocs: {
    description: '',
    url: '',
  },
  servers: [],
  tags: [],
})

// TODO: proper types
const handleSpecUpdate = (newSpec: any) => {
  Object.assign(transformedSpec, {
    // Some specs don’t have servers or tags, make sure they are defined
    servers: [],
    tags: [],
    ...newSpec,
  })

  if (!state.activeSidebar) {
    const firstTag = transformedSpec.tags[0]

    if (firstTag) {
      toggleCollapsedSidebarItem(getTagSectionId(firstTag))
    }

    const firstOperation = transformedSpec.tags[0]?.operations?.[0]

    if (firstOperation) {
      const { httpVerb, operationId } = firstOperation
      setActiveSidebar(`${httpVerb}-${operationId}`)
    }
  }
}

watch(
  () => props.specResult,
  (newSpec) => {
    if (newSpec) {
      handleSpecUpdate(newSpec)
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.querySelector('#tippy')?.scrollTo({
    top: 0,
    left: 0,
  })

  fetchSpecUrl()
})

const showRendered = computed(() => isLargeScreen.value || !props.isEditable)

const showCodeEditor = computed(() => {
  return !props.specResult && props.isEditable
})

// Navigational breadcrumb text from reference info
const breadCrumbs = computed(() => {
  const operations = transformedSpec.tags
    .map((t) => (t.operations || []).flatMap((o) => ({ ...o, tag: t.name })))
    .flat()

  const op = operations.find((o) => {
    return `${o.httpVerb}-${o.operationId}` === state.activeSidebar
  })

  return op ? `${op.tag.toUpperCase()} / ${op.name}` : ''
})
</script>
<template>
  <ThemeStyles :id="theme" />
  <FlowToastContainer />
  <div
    ref="documentEl"
    class="scalar-api-reference references-layout"
    :class="[
      {
        'references-footer-below': footerBelowSidebar,
        'preview': !isEditable,
      },
    ]"
    :style="{ '--full-height': `${elementHeight}px` }">
    <slot name="search-modal">
      <SearchModal
        :spec="transformedSpec"
        variant="search" />
    </slot>
    <!-- Desktop header -->
    <div
      v-if="!isMobile"
      class="references-header">
      <slot name="header"></slot>
    </div>
    <!-- Navigation (sidebar) wrapper -->
    <aside class="references-navigation t-doc__sidebar">
      <!-- Mobile header content -->
      <slot
        v-if="isMobile"
        :label="breadCrumbs"
        name="mobile-header">
        <!-- Fallback mobile header -->
        <MobileHeader>
          {{ breadCrumbs }}
        </MobileHeader>
      </slot>
      <!-- Navigation tree / Table of Contents -->
      <!-- Sorry for the terrible v-if - this is so we only manage the menu state if theres no external mobile header being injected to manage it otherwise -->
      <div
        v-if="
          isMobile && !$slots['mobile-header']
            ? showSidebar && showMobileDrawer
            : showSidebar
        "
        class="references-navigation-list">
        <slot
          v-if="isMobile"
          name="header" />
        <Sidebar :spec="transformedSpec" />
      </div>
    </aside>
    <!-- Swagger file editing -->
    <div
      v-show="showCodeEditor"
      class="references-editor">
      <LazyLoadedSwaggerEditor
        :hocuspocusConfiguration="hocuspocusConfiguration"
        :initialTabState="initialTabState"
        :proxyUrl="proxyUrl"
        :theme="theme"
        :value="specRef"
        @changeTheme="$emit('changeTheme', $event)"
        @specUpdate="handleSpecUpdate" />
    </div>
    <!-- Rendered reference -->
    <template v-if="showRendered">
      <div class="references-rendered">
        <Content
          :ready="true"
          :spec="transformedSpec" />
      </div>
      <div class="references-footer">
        <slot name="footer" />
      </div>
    </template>
    <!-- REST API Client Overlay -->
    <ApiClientModal
      :proxyUrl="proxyUrl"
      :spec="transformedSpec" />
  </div>
</template>
<style scoped>
/* Configurable Layout Variables */
.scalar-api-reference {
  --refs-sidebar-width: var(--theme-sidebar-width, 250px);
  --refs-header-height: var(--theme-header-height, 0px);
}

@media (max-width: 1000px) {
  .scalar-api-reference {
    /* By default add a header on mobile for the navigation */
    --refs-header-height: var(--theme-header-height, 50px);
  }
}

/* ----------------------------------------------------- */
/* References Layout */
.references-layout {
  /* Try to fill the container */
  height: 100dvh;
  max-height: 100%;
  width: 100dvw;
  max-width: 100%;
  flex: 1;

  /* Scroll vertically */
  overflow-y: auto;
  overflow-x: hidden;

  /*
  Calculated by a resize observer and set in the style attribute
  Falls back to the viewport height
  */
  --full-height: 100dvh;

  /* Grid layout */
  display: grid;

  grid-template-rows:
    var(--refs-header-height)
    auto;

  grid-template-columns: var(--refs-sidebar-width) 1fr 1fr;

  grid-template-areas:
    'header header header'
    'navigation editor rendered'
    'navigation editor footer';

  background: var(--theme-background-1, var(--default-theme-background-1));
}

.references-footer-below {
  grid-template-areas:
    'header header header'
    'navigation editor rendered'
    'footer footer footer';
}

.references-header {
  grid-area: header;
  position: sticky;
  top: 0;
  z-index: 10;
}

.references-editor {
  grid-area: editor;
  min-width: 0;
  background: var(--theme-background-1, var(--default-theme-background-1));
  display: flex;
}

.references-navigation {
  position: relative;
  grid-area: navigation;
  position: sticky;
  top: var(--refs-header-height);
  height: calc(var(--full-height) - var(--refs-header-height));
}

.references-rendered {
  position: relative;
  grid-area: rendered;
  min-width: 0;
  background: var(--theme-background-1, var(--default-theme-background-1));
}

.references-navigation-list {
  height: 100%;
  background: var(
    --sidebar-background-1,
    var(
      --default-sidebar-background-1,
      var(--theme-background-1, var(--default-theme-background-1))
    )
  );
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.references-footer {
  grid-area: footer;
}

/* Fix the editor in the middle while allowing the rest of the view to scroll */
.references-layout .references-editor {
  position: sticky;
  top: var(--refs-header-height);
  height: calc(var(--full-height) - var(--refs-header-height));
}

.references-layout.preview {
  grid-template-columns: var(--refs-sidebar-width) 1fr;
  grid-template-areas:
    'header header'
    'navigation rendered'
    'navigation footer';
}

.references-footer-below.preview {
  grid-template-areas:
    'header header'
    'navigation rendered'
    'footer footer';
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
    grid-template-rows: var(--refs-header-height) 1fr auto;
    grid-template-areas:
      'navigation'
      'editor';
  }
  .references-layout.preview {
    grid-template-columns: auto;
    grid-template-areas:
      'navigation'
      'rendered'
      'footer';
  }

  .references-navigation,
  .references-rendered {
    position: static;
    max-height: unset;
  }

  .references-navigation {
    position: sticky;
    top: 0;
    height: var(--refs-header-height);

    width: 100%;
    z-index: 10;
    border-right: none;
  }

  .references-navigation-list {
    position: absolute;

    /* Offset by 1px to avoid gap */
    top: calc(100% - 1px);
    left: 0;
    width: 100%;

    /* Offset by 2px to fill screen and compensate for gap */
    height: calc(var(--full-height) - var(--refs-header-height) + 2px);

    border-top: 1px solid
      var(--theme-border-color, var(--default-theme-border-color));
    display: flex;
    flex-direction: column;
  }
}
</style>
<style lang="postcss">
/** CSS Reset */
.scalar-api-reference,
#headlessui-portal-root {
  p {
    margin: 0;
  }

  i {
    font-style: normal;
  }

  ul,
  ol {
    margin: 0;
    padding: 0;
  }

  /** Add some more things which are normally applied to `html`. */
  font-family: var(--theme-font, var(--default-theme-font));
  line-height: 1.15;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;

  /** Make sure box-sizing is set properly. */
  box-sizing: border-box;

  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  /** Smooth text rendering */
  * {
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  input::placeholder {
    color: var(--theme-color-3, var(--default-theme-color-3));
    font-family: var(--theme-font, var(--default-theme-font));
  }
  input:-ms-input-placeholder {
    color: var(--theme-color-3, var(--default-theme-color-3));
    font-family: var(--theme-font, var(--default-theme-font));
  }
  input::-webkit-input-placeholder {
    color: var(--theme-color-3, var(--default-theme-color-3));
    font-family: var(--theme-font, var(--default-theme-font));
  }

  /** Utilities, how do we deal with them? */
  .flex {
    display: flex;
  }

  .flex-col {
    display: flex;
    min-height: 0;
    flex-direction: column;
  }
  .flex-mobile {
    display: flex;
    min-width: 0;
  }

  @media (max-width: 500px) {
    .flex-mobile {
      flex-direction: column;
    }
  }
  .gap-1 {
    gap: 12px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  /** TODO: Move to components */
  .codemenu-topbar {
    background: var(--theme-background-2, var(--default-theme-background-2));
    border-bottom: 1px solid
      var(--theme-border-color, var(--default-theme-border-color));
    padding: 0 7px 0 12px;
    border-radius: var(--theme-radius, var(--default-theme-radius))
      var(--theme-radius, var(--default-theme-radius)) 0 0;
  }
  .codemenu {
    display: flex;
    position: relative;
    justify-content: space-between;
    align-items: center;
    min-height: 35px;
  }
  .codemenu-tabs {
    display: flex;
    position: relative;
    column-gap: 6px;
  }
  .codemenu-item {
    position: relative;
    display: flex;
    align-items: center;
  }
  .codemenu-item-key {
    font-size: var(--theme-micro, var(--default-theme-micro));
    color: var(--theme-color-3, var(--default-theme-color-3));
    padding: 6px 4px;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: var(--theme-semibold, var(--default-theme-semibold));
    position: relative;
    margin-left: -4px;
    margin-right: -4px;
    border-radius: var(--theme-radius-lg, var(--default-theme-radius-lg));
    text-transform: uppercase;
  }
  .codemenu-item-key:hover {
    background: var(
      --scalar-api-reference-theme-background-3,
      var(--default-scalar-api-reference-theme-background-3)
    );
  }
  .codemenu-item:first-of-type:last-of-type .codemenu-item-key,
  .codemenu-item__active .codemenu-item-key {
    color: var(--theme-color-1, var(--default-theme-color-1));
  }
  .codemenu-item:first-of-type:last-of-type:after,
  .codemenu-item__active:after {
    content: '';
    width: 100%;
    height: 1px;
    position: absolute;
    bottom: -4px;
    background: var(--theme-color-1, var(--default-theme-color-1));
  }

  .codemenu-item__disabled {
    pointer-events: none;
  }
  .endpoint {
    display: flex;
    white-space: nowrap;
    cursor: pointer;
  }
  .endpoint span:first-of-type {
    text-transform: uppercase;
  }

  .codemenu .endpoint {
    overflow: hidden;
  }
  .endpoint .post {
    color: var(--theme-color-green, var(--default-theme-color-green));
  }
  .endpoint .patch {
    color: var(--theme-color-yellow, var(--default-theme-color-yellow));
  }
  .endpoint .get {
    color: var(--theme-color-blue, var(--default-theme-color-blue));
  }
  .endpoint .delete {
    color: var(--theme-color-red, var(--default-theme-color-red));
  }
  .endpoint .put {
    color: var(--theme-color-orange, var(--default-theme-color-orange));
  }
  .endpoint .post,
  .endpoint .get,
  .endpoint .delete,
  .endpoint .put {
    white-space: nowrap;
  }
  .endpoint span {
    color: var(--theme-color-1, var(--default-theme-color-1));
    min-width: 62px;
    display: inline-block;
    text-align: right;
    line-height: 1.55;
    font-family: var(--theme-font-code, var(--default-theme-font-code));
    font-size: var(--theme-small, var(--default-theme-small));
    cursor: pointer;
  }
  .languages .example-item-endpoints {
    background: var(--theme-background-2, var(--default-theme-background-2));
    width: 100%;
    border-top: 1px solid
      var(--theme-border-color, var(--default-theme-border-color));
  }
  .endpoint-response p {
    margin-top: 6px;
    font-size: var(--theme-small, var(--default-theme-small));
    min-height: auto;
    line-height: 17px;
  }

  .codemenu .endpoint span {
    text-align: left;
    min-width: auto;
  }
  .endpoint-response {
    border-top: 1px solid
      var(--theme-border-color, var(--default-theme-border-color));
    padding: 12px 0;
    font-size: var(--theme-small, var(--default-theme-small));
  }

  .tag-description {
    margin-top: 12px;
  }

  .reference .endpoint-title {
    display: flex;
    margin-bottom: 12px;
    margin-top: 24px;
  }
  .copy .title {
    font-size: var(--theme-heading-4, var(--default-theme-heading-4));
    font-weight: var(--theme-semibold, var(--default-theme-semibold));
    color: var(--theme-color-1, var(--default-theme-color-1));
    line-height: 1.45;
    margin: 0;
  }
  .endpoint-response__headers {
    padding-bottom: 0;
  }
  .endpoint-response__headers + .endpoint-response {
    border-top: none;
  }
}
</style>
