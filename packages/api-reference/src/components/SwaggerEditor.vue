<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { CodeEditor } from '@scalar/swagger-editor'
import { useDebounceFn, useMediaQuery, useResizeObserver } from '@vueuse/core'
import { computed, onMounted, reactive, ref } from 'vue'

import { DocumentClasses } from '@guide/index'
import { customFooterClass } from '@guide/styles'

import { useSwaggerParser } from '../hooks/useSwaggerParser'
import { useTemplateStore } from '../stores/template'
import { ApiReferenceClasses } from '../styles'
import type { ReferenceProps, Spec } from '../types'
import { default as ApiClientOverlay } from './ApiClientOverlay.vue'
import { Content } from './Content'
import Sidebar from './Sidebar.vue'

const props = defineProps<ReferenceProps>()

const isLargeScreen = useMediaQuery('(min-width: 1150px)')
const isMobile = useMediaQuery('(max-width: 1000px)')

// Track the container height to control the sidebar height
const elementHeight = ref(0)
const documentEl = ref<HTMLElement | null>(null)
useResizeObserver(documentEl, (entries) => {
  elementHeight.value = entries[0].contentRect.height
})

const { parseSwaggerFile, parserError, parserReady } = useSwaggerParser()
const { toggleCollapsedSidebarItem } = useTemplateStore()
const { state, setActiveSidebar } = useApiClientStore()

// Handle content updates
const spec = reactive<Spec>({
  tags: [],
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
})

const initialContentRenderedSuccessfully = ref(false)

/**
 * Parsing the Swagger file is a heavy process. It’s not necessary to call it for *every* change, so let’s debounce it.
 */
const handleContentUpdate = useDebounceFn((content: string) => {
  parseSwaggerFile(content, (result: Record<any, any>) => {
    Object.assign(spec, result)

    if (!state.activeSidebar) {
      toggleCollapsedSidebarItem(spec.tags[0].name)
      setActiveSidebar(spec.tags[0].operations[0].operationId)
    }

    initialContentRenderedSuccessfully.value = true
  })
}, 300)

onMounted(() => {
  document.querySelector('#tippy')?.scrollTo({
    top: 0,
    left: 0,
  })
})

const showAside = computed(() => isLargeScreen.value || !props.isEditable)

const showCodeEditor = computed(() => {
  return props.isEditable
})

// Navigational breadcrumb text from reference info
const breadCrumbs = computed(() => {
  const operations = spec.tags
    .map((t) => t.operations.flatMap((o) => ({ ...o, tag: t.name })))
    .flat()

  const op = operations.find((o) => o.operationId === state.activeSidebar)

  return op ? `${op.tag.toUpperCase()} / ${op.name}` : 'None'
})
</script>
<template>
  <div
    ref="documentEl"
    :class="[
      'layout-swagger-editor',
      DocumentClasses.Document,
      ApiReferenceClasses.Base,
      { 'footer-below-sidebar': footerBelowSidebar, 'preview': !isEditable },
    ]"
    :style="{ '--full-height': `${elementHeight}px` }">
    <!-- Desktop header -->
    <div
      v-if="!isMobile"
      class="layout-header">
      <slot name="header"></slot>
    </div>
    <!-- Sidebar wrapper -->
    <aside
      class="layout-aside-left"
      :class="DocumentClasses.Sidebar">
      <!-- Mobile header content -->
      <slot
        v-if="isMobile"
        :label="breadCrumbs"
        name="mobile-header" />
      <!-- Primary sidebar content -->
      <div
        v-if="showSidebar"
        class="layout-aside-content">
        <slot
          v-if="isMobile"
          name="header" />
        <Sidebar :spec="spec"> </Sidebar>
      </div>
    </aside>
    <!-- Swagger file editing -->
    <div
      v-show="showCodeEditor"
      class="layout-content">
      <CodeEditor
        :documentName="documentName"
        :error="parserError"
        :token="token"
        :username="username"
        @contentUpdate="handleContentUpdate" />
    </div>
    <!-- Rendered reference -->
    <div
      v-if="showAside"
      class="layout-aside-right">
      <Content
        :ready="parserReady"
        :spec="spec" />
    </div>
    <div
      class="layout-footer"
      :class="customFooterClass"
      v-html="footer"></div>
    <!-- REST API Client Overlay -->
    <ApiClientOverlay :spec="spec" />
  </div>
</template>

<style>
.scalar-api-client,
#headlessui-portal-root {
  --scalar-api-client-post-color: var(--theme-post-color);
  --scalar-api-client-post-background: var(--theme-post-background);
  --scalar-api-client-delete-color: var(--theme-delete-color);
  --scalar-api-client-delete-background: var(--theme-delete-background);
  --scalar-api-client-patch-color: var(--theme-patch-color);
  --scalar-api-client-patch-background: var(--theme-patch-background);
  --scalar-api-client-get-color: var(--theme-get-color);
  --scalar-api-client-get-background: var(--theme-get-background);
  --scalar-api-client-put-color: var(--theme-put-color);
  --scalar-api-client-put-background: var(--theme-put-background);
  --scalar-api-client-rounded: var(--theme-radius);
  --scalar-api-client-background-secondary: var(--theme-background-2);
  --scalar-api-client-color-3: var(--theme-color-3);
  --scalar-api-client-border: var(--theme-border);
  --scalar-api-client-font-sans: var(--theme-font);
  --scalar-api-client-font-mono: var(--theme-font-code);
  --scalar-api-client-font-bold: var(--theme-bold);
  --scalar-api-client-theme-color-1: var(--theme-color-1);
  --scalar-api-client-theme-color-2: var(--theme-color-2);
  --scalar-api-client-theme-shadow-2: var(--theme-shadow-2);
  --scalar-api-client-text-sm: var(--theme-small);
  --scalar-api-client-text-lg: var(--large);
  --scalar-api-client-text-base: var(--normal);
  --scalar-api-client-fill: var(--fill);
  --scalar-api-client-color2: var(--color2);
  --scalar-api-client-bg3: var(--bg3);
  --scalar-api-client-gradient: var(--gradient);
  --scalar-api-client-background-primary: var(--theme-background-1);
  --scalar-api-client-border-color: var(--theme-border-color);
  --scalar-api-client-background-3: var(--theme-background-3);
  --scalar-api-client-font-semibold: var(--theme-semibold);
  --scalar-api-client-text-xs: var(--theme-micro);
}
</style>
