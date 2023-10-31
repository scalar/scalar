<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import {
  type SwaggerEditor,
  SwaggerEditorGettingStarted,
} from '@scalar/swagger-editor'
import { type ThemeId } from '@scalar/themes'
import { useMediaQuery, useResizeObserver } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

import { useTemplateStore } from '../stores/template'
import type { ReferenceConfiguration, Spec } from '../types'
import { default as ApiClientModal } from './ApiClientModal.vue'
import { Content } from './Content'
import MobileHeader from './MobileHeader.vue'
import SearchModal from './SearchModal.vue'
import Sidebar from './Sidebar.vue'

const props = defineProps<{
  currentConfiguration: ReferenceConfiguration
  hasEditor: boolean
  isDarkMode: boolean
  parsedSpec: Spec
  rawSpec: string
  swaggerEditorRef?: null | typeof SwaggerEditor
}>()

defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (e: 'toggleDarkMode'): void
}>()

const isLargeScreen = useMediaQuery('(min-width: 1150px)')
const isMobile = useMediaQuery('(max-width: 1000px)')

// Track the container height to control the sidebar height
const elementHeight = ref(0)
const documentEl = ref<HTMLElement | null>(null)
useResizeObserver(documentEl, (entries) => {
  elementHeight.value = entries[0].contentRect.height
})

const { state } = useApiClientStore()

const showMobileDrawer = computed(() => {
  const { state: s } = useTemplateStore()
  return s.showMobileDrawer
})

onMounted(() => {
  document.querySelector('#tippy')?.scrollTo({
    top: 0,
    left: 0,
  })
})

const showRenderedContent = computed(
  () => isLargeScreen.value || !props.currentConfiguration.isEditable,
)

const showSwaggerEditor = computed(() => {
  return (
    props.hasEditor &&
    !props.currentConfiguration.spec?.preparsedContent &&
    props.currentConfiguration?.isEditable
  )
})
</script>
<template>
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
          :isDarkMode="isDarkMode"
          :searchHotKey="currentConfiguration.searchHotKey"
          :spec="parsedSpec"
          @toggleDarkMode="$emit('toggleDarkMode')" />
      </div>
    </aside>
    <!-- Swagger file editing -->
    <div
      v-show="showSwaggerEditor"
      class="references-editor">
      <slot name="editor" />
    </div>
    <!-- Rendered reference -->
    <template v-if="showRenderedContent">
      <div class="references-rendered">
        <Content
          :parsedSpec="parsedSpec"
          :rawSpec="rawSpec"
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
