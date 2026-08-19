<script setup lang="ts">
import { ScalarIconArrowUpRight } from '@scalar/icons'
import type { ExternalUrls } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'

import { useLocalization } from '@/features/localization'

import CursorLogo from './logos/CursorLogo.vue'
import McpLogo from './logos/McpLogo.vue'
import VsCodeLogo from './logos/VsCodeLogo.vue'
import { useMcpActions, type McpLinkConfiguration } from './use-mcp-actions'

const props = defineProps<{
  config?: McpLinkConfiguration
  externalUrls: ExternalUrls
  url?: string
  workspace: WorkspaceStore
}>()

const { translate } = useLocalization()

const docUrl = defineModel<string>('url')

const { hasConfig, cursorLink, vscodeLink, copyMcpUrl, generateRegisterLink } =
  useMcpActions({
    config: props.config,
    externalUrls: props.externalUrls,
    workspace: props.workspace,
    docUrl,
  })
</script>

<template>
  <div class="scalar-mcp-layer">
    <!--
      When there is no MCP config yet these act as buttons that generate one.
      Using <a href=""> (or undefined href) fails axe link-name; keep a real
      link only when we already have a target URL.
    -->
    <component
      :is="hasConfig ? 'a' : 'button'"
      class="scalar-mcp-layer-link"
      :href="hasConfig ? vscodeLink : undefined"
      :target="hasConfig ? '_blank' : undefined"
      :type="hasConfig ? undefined : 'button'"
      @click="
        (e: MouseEvent) => {
          if (!hasConfig) {
            e.preventDefault()
            generateRegisterLink()
          }
        }
      ">
      <VsCodeLogo class="mcp-logo" />
      VS Code
      <ScalarIconArrowUpRight class="mcp-nav ml-auto size-4" />
    </component>
    <component
      :is="hasConfig ? 'a' : 'button'"
      class="scalar-mcp-layer-link"
      :href="hasConfig ? cursorLink : undefined"
      :target="hasConfig ? '_blank' : undefined"
      :type="hasConfig ? undefined : 'button'"
      @click="
        (e: MouseEvent) => {
          if (!hasConfig) {
            e.preventDefault()
            generateRegisterLink()
          }
        }
      ">
      <CursorLogo class="mcp-logo" />
      Cursor
      <ScalarIconArrowUpRight class="mcp-nav ml-auto size-4" />
    </component>
    <!-- localhost + you don't have a MCP added -->
    <div
      v-if="!hasConfig"
      class="scalar-mcp-layer-link"
      @click="generateRegisterLink">
      <McpLogo class="mcp-logo" />
      {{ translate('mcp.generate') }}
      <ScalarIconArrowUpRight class="mcp-nav ml-auto size-4" />
    </div>
    <!-- you do have an MCP added -->
    <div
      v-else
      class="scalar-mcp-layer-link"
      @click="copyMcpUrl">
      {{ translate('mcp.connect') }}
      <McpLogo class="mcp-logo ml-auto" />
    </div>
  </div>
</template>

<style scoped>
.scalar-mcp-layer {
  /* Rows are absolutely positioned, so the container cannot auto-size to them.
     Derive the hover height from these instead of hardcoding a magic number.
     Bump --mcp-row-count when a row is added or removed. */
  --mcp-row-height: 31px;
  --mcp-row-count: 3;
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
  /* N rows plus the 2px fan-out offset between each */
  height: calc(
    var(--mcp-row-count) * var(--mcp-row-height) + (var(--mcp-row-count) - 1) *
      2px
  );
}
.scalar-mcp-layer-link:hover {
  cursor: pointer !important;
}
.scalar-mcp-layer .scalar-mcp-layer-link {
  /* Must stay above font-size and line-height, which the shorthand resets */
  font: inherit;
  cursor: pointer;
  width: 100%;
  padding: 9px 6px;
  height: var(--mcp-row-height);
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
.scalar-mcp-layer:hover .scalar-mcp-layer-link:nth-last-child(2) {
  transform: translate3d(0, calc(-100% - 2px), 0) scale(0.99);
}
.scalar-mcp-layer .scalar-mcp-layer-link:nth-last-child(3) {
  transform: translate3d(0, -4px, 0) scale(0.98);
}
.scalar-mcp-layer:hover .scalar-mcp-layer-link:nth-last-child(3) {
  transform: translate3d(0, calc(-200% - 4px), 0) scale(1);
}
.scalar-mcp-layer .scalar-mcp-layer-link:nth-last-child(4) {
  transform: translate3d(0, -6px, 0) scale(0.97);
}
.scalar-mcp-layer:hover .scalar-mcp-layer-link:nth-last-child(4) {
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
