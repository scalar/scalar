<script setup lang="ts">
import {
  type SwaggerEditor,
  SwaggerEditorGettingStarted,
} from '@scalar/swagger-editor'
import { type ThemeId } from '@scalar/themes'
import { useKeyboardEvent } from '@scalar/use-keyboard-event'
import { useMediaQuery, useResizeObserver } from '@vueuse/core'
import { computed, onMounted, ref } from 'vue'

import { useTemplateStore } from '../stores/template'
import type { ReferenceConfiguration, Spec } from '../types'
import { default as ApiClientModal } from './ApiClientModal.vue'
import { Content } from './Content'
import SearchModal from './SearchModal.vue'
import Sidebar from './Sidebar.vue'

const props = defineProps<{
  currentConfiguration: ReferenceConfiguration
  parsedSpec: Spec
  rawSpec: string
  swaggerEditorRef?: null | typeof SwaggerEditor
}>()

defineEmits<{
  (e: 'changeTheme', value: ThemeId): void
  (e: 'updateContent', value: string): void
  (e: 'toggleDarkMode'): void
}>()

const isLargeScreen = useMediaQuery('(min-width: 1150px)')

// Track the container height to control the sidebar height
const elementHeight = ref(0)
const documentEl = ref<HTMLElement | null>(null)
useResizeObserver(documentEl, (entries) => {
  elementHeight.value = entries[0].contentRect.height
})

const { state: templateState, setItem: setTemplateItem } = useTemplateStore()

const searchHotKey = computed(
  () => props.currentConfiguration.searchHotKey || 'k',
)

useKeyboardEvent({
  keyList: [searchHotKey.value],
  withCtrlCmd: true,
  handler: () => setTemplateItem('showSearch', !templateState.showSearch),
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
    <!-- Header -->
    <div class="references-header">
      <slot name="header" />
    </div>
    <!-- Navigation (sidebar) wrapper -->
    <aside
      v-show="currentConfiguration.showSidebar"
      class="references-navigation t-doc__sidebar">
      <!-- Navigation tree / Table of Contents -->
      <div class="references-navigation-list">
        <Sidebar :parsedSpec="parsedSpec">
          <template #sidebar-start>
            <slot name="sidebar-start" />
          </template>
          <template #sidebar-end>
            <slot name="sidebar-end" />
          </template>
        </Sidebar>
      </div>
    </aside>
    <!-- Swagger file editing -->
    <div
      v-show="showSwaggerEditor"
      class="references-editor">
      <div class="references-editor-textarea">
        <slot name="editor" />
      </div>
    </div>
    <!-- Rendered reference -->
    <template v-if="showRenderedContent">
      <div class="references-rendered">
        <slot name="content-start" />
        <Content
          :parsedSpec="parsedSpec"
          :rawSpec="rawSpec"
          :ready="true">
          <template
            v-if="currentConfiguration?.isEditable"
            #empty-state>
            <SwaggerEditorGettingStarted
              :theme="currentConfiguration?.theme || 'default'"
              :value="rawSpec"
              @changeTheme="$emit('changeTheme', $event)"
              @openSwaggerEditor="swaggerEditorRef?.handleOpenSwaggerEditor"
              @updateContent="$emit('updateContent', $event)" />
          </template>
        </Content>
        <slot name="content-end" />
      </div>
    </template>
    <!-- Search Overlay -->
    <SearchModal
      :parsedSpec="parsedSpec"
      variant="search" />
    <!-- REST API Client Overlay -->
    <ApiClientModal
      :parsedSpec="parsedSpec"
      :proxyUrl="currentConfiguration?.proxy" />
  </div>
</template>
<style scoped>
/* Configurable Layout Variables */
.scalar-api-reference {
  --refs-sidebar-width: var(--theme-sidebar-width, 250px);
  --refs-header-height: var(--theme-header-height, 0px);
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
  grid-template-rows: var(--refs-header-height) auto;
  grid-template-columns: var(--refs-sidebar-width) 1fr;
  grid-template-areas:
    'header header'
    'navigation rendered';

  background: var(--theme-background-1, var(--default-theme-background-1));
}

.references-header {
  grid-area: header;
  position: sticky;
  top: 0;
  z-index: 10;

  height: var(--refs-header-height);
}

.references-editor {
  grid-area: editor;
  display: flex;
  min-width: 0;
  background: var(--theme-background-1, var(--default-theme-background-1));
}

.references-navigation {
  grid-area: navigation;
}

.references-rendered {
  position: relative;
  grid-area: rendered;
  min-width: 0;
  background: var(--theme-background-1, var(--default-theme-background-1));
}

.references-navigation-list {
  position: sticky;
  top: var(--refs-header-height);
  height: calc(var(--full-height) - var(--refs-header-height));
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
    'navigation editor rendered';
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
    grid-template-rows: var(--refs-header-height) 0px auto;

    grid-template-areas:
      'header'
      'navigation'
      'rendered';
  }
  .references-editable {
    grid-template-areas:
      'header'
      'navigation'
      'editor';
  }

  .references-navigation,
  .references-rendered {
    position: static;
    max-height: unset;
  }

  .references-navigation {
    height: 0px;
    z-index: 10;
  }

  .references-navigation-list {
    position: absolute;

    /* Offset by 1px to avoid gap */
    top: calc(var(--refs-header-height) - 1px);

    /* Add a pixel to cover the bottom of the viewport */
    height: calc(var(--full-height) - var(--refs-header-height) + 1px);
    width: 100%;

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
