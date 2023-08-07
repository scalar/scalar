<script setup lang="ts">
import { useApiClientStore } from '@scalar/api-client'
import { CodeEditor } from '@scalar/swagger-editor'
import { useDebounceFn, useMediaQuery, useResizeObserver } from '@vueuse/core'
import { computed, onMounted, reactive, ref } from 'vue'

import { DocumentClasses } from '@guide/index'
import { customFooterClass } from '@guide/styles'

import { useSwaggerParser } from '../hooks/useSwaggerParser'
import { useTemplateStore } from '../stores/template'
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
/** TODO: Move variables to main code base */
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
<style>
/** TODO: Move to components */
.codemenu-topbar {
  background: var(--theme-background-2);
  border-bottom: 1px solid var(--theme-border-color);
  padding: 0 7px 0 12px;
  border-radius: var(--theme-radius) var(--theme-radius) 0 0;
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
  font-size: var(--theme-mini);
  color: var(--theme-color-3);
  padding: 6px 4px;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--theme-semibold);
  position: relative;
  margin-left: -4px;
  margin-right: -4px;
  border-radius: var(--theme-radius);
  text-transform: uppercase;
}

.codemenu-item-key:hover {
  background: var(--theme-background-3);
}
.codemenu-item:first-of-type:last-of-type .codemenu-item-key,
.codemenu-item__active .codemenu-item-key {
  color: var(--theme-color-1);
}
.codemenu-item:first-of-type:last-of-type:after,
.codemenu-item__active:after {
  content: '';
  width: 100%;
  height: 1px;
  position: absolute;
  bottom: -4px;
  background: var(--theme-color-1);
}

.codemenu-item__disabled {
  pointer-events: none;
}
.codemenu-item-url {
  margin-left: 6px;
  color: var(--theme-color-2);
  white-space: nowrap;
  overflow: hidden;
  cursor: default;
  text-overflow: ellipsis;
  text-transform: none !important;
}

.client-libraries {
  border-radius: var(--theme-radius-lg);
  border: var(--theme-border);
  margin: 12px 0;
  overflow: hidden;
}
.client-libraries-header {
  text-transform: uppercase;
  padding: 9px 12px;
  font-size: var(--theme-mini);
  font-weight: var(--theme-semibold);
  color: var(--theme-color-3);
  border-bottom: 1px solid var(--theme-border-color);
}
.client-libraries-content {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
}
.client-libraries-footer {
  padding: 9px 12px;
  font-weight: var(--theme-semibold);
  font-size: var(--theme-mini);
  color: var(--theme-color-2);
  width: 100%;
  background: var(--theme-background-2);
  border-top: var(--theme-border);
}

.example-item {
  border-radius: var(--theme-radius-lg);
  overflow: hidden;
  border: 1px solid var(--theme-border-color);
}
.example-item-title {
  padding: 9px 12px;
  font-weight: var(--theme-semibold);
  font-size: var(--theme-mini);
  color: var(--theme-color-3);
  text-transform: uppercase;
  display: flex;
  justify-content: space-between;
  background: var(--theme-background-2);
  border-bottom: 1px solid var(--theme-border-color);
}
.example-item-title span {
  display: flex;
  align-items: center;
}
.example-item-title-add {
  text-transform: initial;
}
.example-item-title-add:hover {
  color: var(--theme-color-1);
  cursor: pointer;
}
.example-item-title span svg {
  width: 12px;
  margin-right: 6px;
}
.example-item-endpoints {
  padding: 12px 0 12px 12px;
  overflow: auto;
  background: var(--theme-background-2);
}

.endpoint {
  display: flex;
  white-space: nowrap;
  cursor: pointer;
}
.codemenu .endpoint {
  overflow: hidden;
}
.endpoint .post {
  color: var(--theme-post-color);
}
.endpoint .patch {
  color: var(--theme-patch-color);
}
.endpoint .get {
  color: var(--theme-get-color);
}
.endpoint .delete {
  color: var(--theme-delete-color);
}
.endpoint .put {
  color: var(--theme-put-color);
}
.endpoint .post,
.endpoint .get,
.endpoint .delete,
.endpoint .put {
  white-space: nowrap;
}
.base-url,
.endpoint span {
  color: var(--theme-color-2);
  min-width: 62px;
  display: inline-block;
  text-align: right;
  line-height: 1.55;
  font-family: var(--theme-font-code);
  font-size: var(--theme-mini);
  text-transform: uppercase;
  cursor: pointer;
}
.endpoint:hover span:nth-of-type(2) {
  color: var(--theme-color-1);
}
.base-url {
  min-width: initial;
  text-transform: lowercase;
  text-align: left;
}
.languages .example-item-endpoints {
  background: var(--theme-background-2);
  width: 100%;
  border-top: var(--theme-border);
}
.endpoint-response p {
  margin-top: 6px;
  font-size: var(--theme-small);
  min-height: auto;
  line-height: 17px;
}
.parameter p {
  margin-top: 6px;
}
.parameter .parameter-child {
  border: var(--theme-border);
  border-radius: 20px;
  margin-top: 12px;
  width: fit-content;
}
.parameter .parameter {
  border: none !important;
}
.parameter-child-trigger {
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 500;
  color: var(--theme-color-3);
  font-size: var(--theme-mini);
  display: flex;
  align-items: center;
  user-select: none;
}
.parameter-child-trigger:has(+ .parameter li:first-of-type:last-of-type) {
  display: none;
}
.parameter-child-trigger:hover {
  color: var(--theme-color-1);
}
.parameter-child-trigger > span:before {
  content: 'Show ';
}
.parameter-child__open > .parameter-child-trigger span:before {
  content: 'Hide ';
}
.parameter-child-trigger svg {
  height: 10px;
  width: 10px;
  margin-right: 6px;
}
.parameter-child__open .parameter-child-trigger svg {
  transform: rotate(45deg);
}
.parameter .parameter li:first-of-type {
  border-top: none;
}
.parameter .parameter li {
  padding: 12px;
}
.parameter-child__open > .parameter {
  display: block;
}
.parameter .parameter-child__open {
  width: 100%;
  border-radius: 6px;
}
.parameter .parameter-child__open > svg {
  transform: rotate(45deg);
}
.parameter-child__open > .parameter-child-trigger {
  border-bottom: var(--theme-border);
}
.codemenu .endpoint span {
  text-align: left;
  min-width: auto;
}
.example-item-endpoints span + span {
  text-align: left;
  margin-left: 12px;
  text-transform: initial;
}
.endpoint-response {
  border-top: var(--theme-border);
  padding: 12px 0;
  font-size: var(--theme-small);
}

.heading {
  margin-top: 0px !important;
}
.tag-description {
  margin-top: 12px;
}

.endpoint-title {
  display: flex;
  margin-bottom: 12px;
  margin-top: 24px;
}
.copy .title {
  font-size: var(--theme-heading-4);
  font-weight: var(--theme-semibold);
  color: var(--theme-color-1);
  line-height: 1.45;
}
.response-headers-container {
  border: var(--theme-border);
  border-radius: 6px;
  margin-top: 12px;
}
.response-headers-container .parameter li {
  padding: 12px;
}
.response-headers-container .title {
  padding: 6px 12px;
  font-size: var(--theme-small);
}
.response-headers-container .endpoint-title {
  margin: 0;
}
.response-headers-container .title {
  padding: 6px 12px;
  font-size: var(--theme-small);
}
.endpoint-response__headers {
  padding-bottom: 0;
}
.endpoint-response__headers + .endpoint-response {
  border-top: none;
}
.parameter {
  list-style: none;
  font-size: var(--theme-small);
}
.parameter li {
  border-top: var(--theme-border);
  padding: 12px 0;
}
.parameter-name {
  font-weight: 500;
  margin-right: 6px;
  font-family: var(--theme-font-code);
  font-size: 13px;
  color: var(--theme-color-1);
}
.parameter-type,
.parameter-required {
  color: var(--theme-color-3);
  font-weight: var(--semi-bold);
  margin-right: 6px;
  position: relative;
}
.marc_required {
  text-transform: uppercase;
  font-size: 11px;
  font-weight: var(--bol);
  color: #ffb040;
}
.parameter-options {
  position: relative;
}
.copy .parameter-description:empty {
  display: none;
}

/* ----------------------------------------------------- */

.reference {
  position: relative;
  padding: 0 60px;
  width: 100%;
}

.reference:not(:last-of-type) {
  border-bottom: var(--theme-border);
}

.reference-container {
  position: relative;
  display: flex;
  gap: 48px;

  max-width: 1120px;
  margin: auto;
  padding: 90px 0;
}

.reference-container + .reference-container {
  border-top: var(--theme-border);
}

.reference-container .copy,
.reference-container .example {
  flex: 1;
  min-width: 0;
}

.response .cm-editor {
  max-height: calc(50vh - 90px);
}

.example {
  padding-top: 48px;
  top: 0;
  height: fit-content;
  position: sticky;
}

.copy .tag-description a {
  color: var(--theme-color-1);
  text-decoration: underline;
}

/* ----------------------------------------------------- */
/* Responsive styles for narrow reference container (900px) */
.references-narrow .reference {
  padding: 0 30px;
}
@media screen and (max-width: 1000px) {
  .references-narrow .reference {
    padding: 0 24px;
  }
}
.references-narrow .reference-container {
  flex-direction: column;
  gap: 24px;
  padding: 48px 0;
}

.references-narrow .example {
  padding-top: 0;
}

.editor-heading h1 {
  font-size: var(--font-size, var(--theme-heading-2));
  font-weight: var(--font-weight, var(--theme-bold));
  color: var(--font-color, var(--theme-color-1));
  line-height: 1.45;
  margin-top: 60px;
}
</style>
