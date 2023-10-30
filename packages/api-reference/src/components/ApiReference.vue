<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import {
  type SwaggerEditor,
  SwaggerEditorGettingStarted,
} from '@scalar/swagger-editor'
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

import { deepMerge, getTagSectionId } from '../helpers'
import { useSpec } from '../hooks'
import { useTemplateStore } from '../stores/template'
import type { ReferenceConfiguration, ReferenceProps, Spec } from '../types'
import { default as ApiClientModal } from './ApiClientModal.vue'
import { Content } from './Content'
import MobileHeader from './MobileHeader.vue'
import SearchModal from './SearchModal.vue'
import Sidebar from './Sidebar.vue'

const props = withDefaults(defineProps<ReferenceProps>(), {
  showSidebar: undefined,
  isEditable: undefined,
  footerBelowSidebar: undefined,
})

const emits = defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (
    e: 'startAIWriter',
    value: string[],
    swaggerData: string,
    swaggerType: 'json' | 'yaml',
  ): void
}>()

const swaggerEditorRef = ref<typeof SwaggerEditor | undefined>()

/** Merge the default configuration with the given configuration. */
const currentConfiguration = computed((): ReferenceConfiguration => {
  if (
    props.spec ||
    props.specUrl ||
    props.specResult ||
    props.proxyUrl ||
    props.theme ||
    props.initialTabState ||
    props.showSidebar ||
    props.footerBelowSidebar ||
    props.isEditable ||
    props.hocuspocusConfiguration
  ) {
    console.warn(
      '[ApiReference] The <ApiReference /> component now accepts a single `configuration` prop. Please update your code.',
    )
  }

  return deepMerge(props.configuration ?? {}, {
    spec: {
      content: props.spec ?? undefined,
      url: props.specUrl ?? undefined,
      preparsedContent: props.specResult ?? undefined,
    },
    proxy: props.proxyUrl ?? undefined,
    theme: props.theme ?? 'default',
    tabs: {
      initialContent: props.initialTabState ?? 'Getting Started',
    },
    showSidebar: props.showSidebar ?? true,
    isEditable: props.isEditable ?? false,
    footerBelowSidebar: props.footerBelowSidebar ?? false,
    hocuspocusConfiguration: props.hocuspocusConfiguration ?? undefined,
  })
})

const specConfiguration = computed(() => {
  return currentConfiguration.value.spec
})

const { rawSpecRef: newRawSpecRef, setRawSpecRef } = useSpec({
  configuration: specConfiguration,
})

/**
 * The editor component has heavy dependencies (process), let's lazy load it.
 */
const LazyLoadedSwaggerEditor = defineAsyncComponent(() =>
  import('@scalar/swagger-editor').then((module) => module.SwaggerEditor),
)

const getSpecContent = (
  value: string | Record<string, any> | (() => Record<string, any>) | undefined,
) =>
  typeof value === 'string'
    ? value
    : typeof value === 'object'
    ? JSON.stringify(value)
    : typeof value === 'function'
    ? JSON.stringify(value())
    : ''

const parsedSpecRef = ref<string>(
  getSpecContent(currentConfiguration.value.spec?.preparsedContent),
)

// Let’s keep a copy, just to have the content ready to download.
const rawSpecRef = ref<string>(
  getSpecContent(currentConfiguration.value.spec?.content),
)

watch(
  currentConfiguration,
  () => {
    if (currentConfiguration.value.spec?.content) {
      parsedSpecRef.value = getSpecContent(
        currentConfiguration.value.spec?.content,
      )
    }
  },
  { immediate: true },
)

const fetchSpecFromUrl = () => {
  if (
    currentConfiguration.value.spec?.url === undefined ||
    currentConfiguration.value.spec?.url.length === 0
  ) {
    return
  }

  fetch(currentConfiguration.value.spec?.url)
    .then((response) => {
      if (!response.ok) {
        throw new Error('The provided OpenAPI/Swagger spec URL is invalid.')
      }

      return response.text()
    })
    .then((data) => {
      rawSpecRef.value = data
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

const { setCollapsedSidebarItem } = useTemplateStore()
const { state } = useApiClientStore()

const showMobileDrawer = computed(() => {
  const { state: s } = useTemplateStore()
  return s.showMobileDrawer
})

// Handle content updates
const parsedSpec = reactive<Spec>({
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
  components: {
    schemas: {},
    securitySchemes: {},
  },
  tags: [],
})

// TODO: proper types for the parsed spec
const handleParsedSpecUpdate = (newSpec: any) => {
  Object.assign(parsedSpec, {
    // Some specs don’t have servers or tags, make sure they are defined
    servers: [],
    tags: [],
    ...newSpec,
  })

  const firstTag = parsedSpec.tags[0]

  if (firstTag) {
    setCollapsedSidebarItem(getTagSectionId(firstTag), true)
  }
}

function handleContentUpdate(newContent: string) {
  setRawSpecRef(newContent)
}

watch(
  () => currentConfiguration.value.spec?.preparsedContent,
  (newSpec) => {
    if (newSpec) {
      handleParsedSpecUpdate(newSpec)
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.querySelector('#tippy')?.scrollTo({
    top: 0,
    left: 0,
  })

  fetchSpecFromUrl()
})

const showRenderedContent = computed(
  () => isLargeScreen.value || !currentConfiguration.value?.isEditable,
)

const showSwaggerEditor = computed(() => {
  return (
    !currentConfiguration.value.spec?.preparsedContent &&
    currentConfiguration.value?.isEditable
  )
})

function handleAIWriter(
  value: string[],
  swaggerData: string,
  swaggerType: 'json' | 'yaml',
) {
  emits('startAIWriter', value, swaggerData, swaggerType)
}
</script>
<template>
  newRawSpecRef: {{ newRawSpecRef }}
  <ThemeStyles :id="currentConfiguration?.theme" />
  <FlowToastContainer />
  <div
    ref="documentEl"
    class="scalar-api-reference references-layout"
    :class="[
      {
        'references-footer-below': currentConfiguration?.footerBelowSidebar,
        'references-editable': showSwaggerEditor,
      },
    ]"
    :style="{ '--full-height': `${elementHeight}px` }">
    <slot name="search-modal">
      <SearchModal
        :spec="parsedSpec"
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
        :label="state.activeBreadcrumb"
        name="mobile-header">
        <!-- Fallback mobile header -->
        <MobileHeader>
          {{ state.activeBreadcrumb }}
        </MobileHeader>
      </slot>
      <!-- Navigation tree / Table of Contents -->
      <!-- Sorry for the terrible v-if - this is so we only manage the menu state if theres no external mobile header being injected to manage it otherwise -->
      <div
        v-if="
          isMobile && !$slots['mobile-header']
            ? currentConfiguration.showSidebar && showMobileDrawer
            : currentConfiguration.showSidebar
        "
        class="references-navigation-list">
        <slot
          v-if="isMobile"
          name="header" />
        <Sidebar
          :searchHotKey="currentConfiguration.searchHotKey"
          :spec="parsedSpec" />
      </div>
    </aside>
    <!-- Swagger file editing -->
    <div
      v-show="showSwaggerEditor"
      class="references-editor">
      <LazyLoadedSwaggerEditor
        ref="swaggerEditorRef"
        :aiWriterMarkdown="aiWriterMarkdown"
        :hocuspocusConfiguration="currentConfiguration?.hocuspocusConfiguration"
        :initialTabState="currentConfiguration?.tabs?.initialContent"
        :proxyUrl="currentConfiguration?.proxy"
        :theme="currentConfiguration?.theme"
        :value="newRawSpecRef"
        @changeTheme="$emit('changeTheme', $event)"
        @contentUpdate="handleContentUpdate"
        @parsedSpecUpdate="handleParsedSpecUpdate"
        @startAIWriter="handleAIWriter" />
    </div>
    <!-- Rendered reference -->
    <template v-if="showRenderedContent">
      <div class="references-rendered">
        <Content
          :parsedSpec="parsedSpec"
          :rawSpec="rawSpecRef"
          :ready="true">
          <template
            v-if="currentConfiguration?.isEditable"
            #empty-state>
            <SwaggerEditorGettingStarted
              :theme="currentConfiguration?.theme || 'default'"
              @changeExample="swaggerEditorRef?.handleChangeExample"
              @changeTheme="$emit('changeTheme', $event)"
              @openSwaggerEditor="swaggerEditorRef?.handleOpenSwaggerEditor" />
          </template>
        </Content>
      </div>
      <div class="references-footer">
        <slot name="footer" />
      </div>
    </template>
    <!-- REST API Client Overlay -->
    <ApiClientModal
      :proxyUrl="currentConfiguration?.proxy"
      :spec="parsedSpec" />
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

  grid-template-columns: var(--refs-sidebar-width) 1fr;
  grid-template-areas:
    'header header'
    'navigation rendered'
    'navigation footer';

  background: var(--theme-background-1, var(--default-theme-background-1));
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

/* Fix the editor in the middle while allowing the rest of the view to scroll */
.references-layout .references-editor {
  position: sticky;
  top: var(--refs-header-height);
  height: calc(var(--full-height) - var(--refs-header-height));
}

.references-editable {
  grid-template-columns: var(--refs-sidebar-width) 1fr 1fr;

  grid-template-areas:
    'header header header'
    'navigation editor rendered'
    'navigation editor footer';
}

/* Footer */
.references-footer {
  grid-area: footer;
}
@media (min-width: 1001px) {
  .references-footer-below {
    grid-template-areas:
      'header header'
      'navigation rendered'
      'footer footer';
  }
  .references-footer-below.references-editable {
    grid-template-areas:
      'header header header'
      'navigation editor rendered'
      'footer footer footer';
  }
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
      'rendered'
      'footer';
  }
  .references-editable {
    grid-template-areas:
      'navigation'
      'editor';
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
}
</style>
