<script setup lang="ts">
import { useLoadingState } from '@scalar/components'
import { isValidUrl } from '@scalar/helpers/url/is-valid-url'
import { ScalarIconArrowUpRight } from '@scalar/icons'
import type { ExternalUrls } from '@scalar/types/api-reference'
import { useClipboard } from '@scalar/use-hooks/useClipboard'
import { useToasts } from '@scalar/use-toasts'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { nextTick } from 'vue'

import { uploadTempDocument } from '@/helpers/upload-temp-document'

const props = defineProps<{
  config?: {
    name?: string
    url?: string
  }
  externalUrls: ExternalUrls
  url?: string
  workspace: WorkspaceStore
}>()

const { copyToClipboard } = useClipboard()

const { toast } = useToasts()

const loader = useLoadingState()

const hasConfig = props.config?.name || props.config?.url

const encoded = btoa(JSON.stringify(props.config ?? {}))

const name = encodeURIComponent(props.config?.name ?? '')
const cursorLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=${name}&config=${encoded}`
const vscodeLink = `vscode:mcp/install?${encodeURIComponent(JSON.stringify(props.config ?? {}))}`

const docUrl = defineModel<string>('url')

/** Generate and open the registration link */
async function generateRegisterLink() {
  if (loader.isLoading || !props.workspace) {
    return
  }

  // If we have already have a document URL that is valid
  if (docUrl.value && isValidUrl(docUrl.value)) {
    openRegisterLink(docUrl.value)
    return
  }

  loader.start()

  const document = props.workspace.exportActiveDocument('json')

  if (!document) {
    toast('Unable to export active document', 'error')
    await loader.invalidate()
    return
  }

  try {
    docUrl.value = await uploadTempDocument(document, props.externalUrls)
    await loader.validate()
    openRegisterLink(docUrl.value)

    await nextTick()

    await loader.clear()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred'
    toast(message, 'error')
    await loader.invalidate()
  }
}

/** Open the registration link in a new tab */
function openRegisterLink(documentUrl: string) {
  const url = new URL(`${props.externalUrls.dashboardUrl}/register`)
  url.searchParams.set('url', documentUrl)
  url.searchParams.set('createMcp', 'true')

  window.open(url.toString(), '_blank')
}
</script>

<template>
  <div class="scalar-mcp-layer">
    <a
      class="scalar-mcp-layer-link"
      :href="hasConfig ? vscodeLink : undefined"
      :target="hasConfig ? '_blank' : undefined"
      @click="
        (e) => {
          if (!hasConfig) {
            e.preventDefault()
            generateRegisterLink()
          }
        }
      ">
      <svg
        class="mcp-logo"
        fill="currentColor"
        height="800"
        viewBox="0 0 32 32"
        width="800"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M30.865 3.448 24.282.281a1.99 1.99 0 0 0-2.276.385L9.397 12.171 3.902 8.004a1.33 1.33 0 0 0-1.703.073L.439 9.681a1.33 1.33 0 0 0-.005 1.969L5.2 15.999.434 20.348a1.33 1.33 0 0 0 .005 1.969l1.76 1.604a1.33 1.33 0 0 0 1.703.073l5.495-4.172 12.615 11.51a1.98 1.98 0 0 0 2.271.385l6.589-3.172a1.99 1.99 0 0 0 1.13-1.802V5.248c0-.766-.443-1.469-1.135-1.802zm-6.86 19.818L14.432 16l9.573-7.266z" />
      </svg>
      VS Code
      <ScalarIconArrowUpRight class="mcp-nav ml-auto size-4" />
    </a>
    <a
      class="scalar-mcp-layer-link"
      :href="hasConfig ? cursorLink : undefined"
      :target="hasConfig ? '_blank' : undefined"
      @click="
        (e) => {
          if (!hasConfig) {
            e.preventDefault()
            generateRegisterLink()
          }
        }
      ">
      <svg
        class="mcp-logo"
        viewBox="0 0 466.73 532.09"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M457.43 125.94 244.42 2.96a22.13 22.13 0 0 0-22.12 0L9.3 125.94C3.55 129.26 0 135.4 0 142.05v247.99c0 6.65 3.55 12.79 9.3 16.11l213.01 122.98a22.13 22.13 0 0 0 22.12 0l213.01-122.98c5.75-3.32 9.3-9.46 9.3-16.11V142.05c0-6.65-3.55-12.79-9.3-16.11zm-13.38 26.05L238.42 508.15c-1.39 2.4-5.06 1.42-5.06-1.36V273.58c0-4.66-2.49-8.97-6.53-11.31L24.87 145.67c-2.4-1.39-1.42-5.06 1.36-5.06h411.26c5.84 0 9.49 6.33 6.57 11.39h-.01Z"
          style="fill: currentColor" />
      </svg>
      Cursor
      <ScalarIconArrowUpRight class="mcp-nav ml-auto size-4" />
    </a>
    <!-- localhost + you don't have a MCP added -->
    <div
      v-if="!hasConfig"
      class="scalar-mcp-layer-link"
      @click="generateRegisterLink">
      <svg
        class="mcp-logo"
        fill="none"
        height="173"
        viewBox="0 0 156 173"
        width="156"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="m6 80.912 67.882-67.883c9.373-9.372 24.569-9.372 33.941 0s9.373 24.569 0 33.942L56.558 98.236"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="12" />
        <path
          d="m57.265 97.529 50.558-50.558c9.373-9.373 24.569-9.373 33.942 0l.353.353c9.373 9.373 9.373 24.569 0 33.941L80.725 142.66a8 8 0 0 0 0 11.313l12.606 12.607"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="12" />
        <path
          d="M90.853 30 40.648 80.205c-9.372 9.372-9.372 24.568 0 33.941 9.373 9.372 24.569 9.372 33.941 0l50.205-50.205"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="12" />
      </svg>
      Generate MCP
      <ScalarIconArrowUpRight class="mcp-nav ml-auto size-4" />
    </div>
    <!-- you do have an MCP added -->
    <div
      v-else
      class="scalar-mcp-layer-link"
      @click="copyToClipboard(config?.url ?? '')">
      Connect MCP
      <svg
        class="mcp-logo ml-auto"
        fill="none"
        height="173"
        viewBox="0 0 156 173"
        width="156"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="m6 80.912 67.882-67.883c9.373-9.372 24.569-9.372 33.941 0s9.373 24.569 0 33.942L56.558 98.236"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="12" />
        <path
          d="m57.265 97.529 50.558-50.558c9.373-9.373 24.569-9.373 33.942 0l.353.353c9.373 9.373 9.373 24.569 0 33.941L80.725 142.66a8 8 0 0 0 0 11.313l12.606 12.607"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="12" />
        <path
          d="M90.853 30 40.648 80.205c-9.372 9.372-9.372 24.568 0 33.941 9.373 9.372 24.569 9.372 33.941 0l50.205-50.205"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-width="12" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.scalar-mcp-layer {
  gap: 2px;
  display: flex;
  flex-direction: column;
  background: transparent;
  position: relative;
  justify-content: flex-end;
  transition: all 0.4s ease-in-out;
  height: 32px;
}
.scalar-mcp-layer:hover {
  height: 172px;
}
.scalar-mcp-layer-link:hover {
  cursor: pointer !important;
}
.scalar-mcp-layer .scalar-mcp-layer-link {
  cursor: pointer;
  width: 100%;
  padding: 9px 6px;
  height: 31px;
  display: block;
  text-align: center;
  display: flex;
  align-items: center;
  white-space: nowrap;
  font-size: var(--scalar-small);
  line-height: 1.385;
  text-decoration: none;
  border-radius: var(--scalar-radius);
  border: var(--scalar-border-width) solid var(--scalar-border-color);
  gap: 6px;
  color: var(--scalar-sidebar-color-1);
  background: var(--scalar-background-1);
  transition: transform 0.2s ease-in-out;
  position: absolute;
  bottom: 0;
}
/* increase click area for gap */
.scalar-mcp-layer-link:after {
  content: '';
  position: absolute;
  bottom: -2px;
  height: 2px;
  width: 100%;
  left: 0;
}
.scalar-mcp-layer div.scalar-mcp-layer-link {
  cursor: default;
}
.scalar-mcp-layer .scalar-mcp-layer-link:nth-last-child(1) {
  transform: translate3d(0, 0, 0);
  position: relative;
}
.scalar-mcp-layer .scalar-mcp-layer-link:nth-last-child(2) {
  transform: translate3d(0, -2px, 0) scale(0.99);
}
.scalar-mcp-layer:hover a:nth-last-child(2) {
  transform: translate3d(0, calc(-100% - 2px), 0) scale(0.99);
}
.scalar-mcp-layer .scalar-mcp-layer-link:nth-last-child(3) {
  transform: translate3d(0, -4px, 0) scale(0.98);
}
.scalar-mcp-layer:hover a:nth-last-child(3) {
  transform: translate3d(0, calc(-200% - 4px), 0) scale(1);
}
.scalar-mcp-layer .scalar-mcp-layer-link:nth-last-child(4) {
  transform: translate3d(0, -6px, 0) scale(0.97);
}
.scalar-mcp-layer:hover a:nth-last-child(4) {
  transform: translate3d(0, calc(-300% - 6px), 0) scale(1);
}
.scalar-mcp-layer .scalar-mcp-layer-link:nth-last-child(5) {
  transform: translate3d(0, -8px, 0) scale(0.96);
}
.scalar-mcp-layer:hover .scalar-mcp-layer-link:nth-last-child(5) {
  transform: translate3d(0, calc(-400% - 8px), 0) scale(1);
}
.scalar-mcp-layer:hover .scalar-mcp-layer-link {
  transition: transform 0.2s ease-in-out 0.1s;
}
.scalar-mcp-layer .scalar-mcp-layer-link:hover {
  background: var(--scalar-background-2);
}
.scalar-mcp-layer .mcp-logo {
  width: 16px;
  height: 16px;
  color: var(--scalar-sidebar-color-1);
}
.mcp-nav {
  color: var(--scalar-sidebar-color-2);
}
</style>
