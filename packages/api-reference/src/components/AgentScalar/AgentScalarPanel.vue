<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarTooltip } from '@scalar/components/tooltip'
import {
  ScalarIconArrowDown,
  ScalarIconArrowLineLeft,
  ScalarIconArrowLineRight,
  ScalarIconSparkle,
  ScalarIconX,
} from '@scalar/icons'
import type {
  ApiReferenceConfigurationWithSource,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import {
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue'

import { useLocalization } from '@/features/localization'
import { useAgentContext } from '@/hooks/use-agent'

import CursorLogo from './logos/CursorLogo.vue'
import McpLogo from './logos/McpLogo.vue'
import VsCodeLogo from './logos/VsCodeLogo.vue'
import { useMcpActions, type McpLinkConfiguration } from './use-mcp-actions'

const props = defineProps<{
  agentScalarConfiguration?: ApiReferenceConfigurationWithSource['agent']
  externalUrls: ExternalUrls
  mcpConfiguration?: McpLinkConfiguration
  showMcp?: boolean
  url?: string
  workspaceStore: WorkspaceStore
}>()

const agentContext = useAgentContext()
const { translate } = useLocalization()

const docUrl = defineModel<string>('url')

const { hasConfig, cursorLink, vscodeLink, copyMcpUrl, generateRegisterLink } =
  useMcpActions({
    config: props.mcpConfiguration,
    externalUrls: props.externalUrls,
    workspace: props.workspaceStore,
    docUrl,
  })

/**
 * The chat surface is the heavy part of the panel. It is loaded on first open
 * and kept mounted thereafter, so a visitor who never opens the assistant
 * never downloads it.
 */
const AgentScalarChatInterface = defineAsyncComponent(
  async () => import('./AgentScalarChatInterface.vue'),
)

/** Latches once the panel is first opened, gating the chat surface's mount. */
const hasOpened = ref(false)

const isExpanded = ref(false)

/** The expanded panel fills the viewport up to the reference sidebar. */
const expandedWidth = 'calc(100vw - var(--refs-sidebar-width, 0px))'

watch(
  () => agentContext.value?.showAgent.value,
  (open) => {
    if (open) {
      hasOpened.value = true
    } else {
      isExpanded.value = false
      showMcpList.value = false
    }
  },
)

const showMcpList = ref(false)
const mcpListAreaRef = useTemplateRef<HTMLDivElement>('mcpListArea')

const handleClickOutside = (e: MouseEvent): void => {
  if (
    showMcpList.value &&
    mcpListAreaRef.value &&
    !mcpListAreaRef.value.contains(e.target as Node)
  ) {
    showMcpList.value = false
  }
}

const handleInstallClick = (e: MouseEvent): void => {
  if (!hasConfig) {
    e.preventDefault()
    generateRegisterLink()
  }
  showMcpList.value = false
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div
    :aria-label="translate('agent.askAi')"
    class="agent-scalar-panel"
    :class="{ 'agent-scalar-panel--open': agentContext?.showAgent.value }"
    role="complementary"
    :style="isExpanded ? { '--agent-scalar-panel-width': expandedWidth } : {}"
    @keydown.escape="agentContext?.closeAgent()">
    <div class="agent-scalar-panel-header">
      <div class="agent-scalar-panel-header-left">
        <ScalarTooltip
          :content="translate('agent.closeChat')"
          placement="bottom">
          <span class="agent-scalar-panel-tooltip-trigger">
            <ScalarIconButton
              class="agent-scalar-panel-action-btn hover:bg-b-2 m-0"
              :icon="ScalarIconX"
              :label="translate('agent.closeChat')"
              size="md"
              @click="agentContext?.closeAgent()" />
          </span>
        </ScalarTooltip>
        <ScalarTooltip
          :content="
            isExpanded ? translate('agent.collapse') : translate('agent.expand')
          "
          placement="bottom">
          <span
            class="agent-scalar-panel-tooltip-trigger agent-scalar-panel-expand-btn">
            <ScalarIconButton
              class="agent-scalar-panel-action-btn hover:bg-b-2 m-0"
              :icon="
                isExpanded ? ScalarIconArrowLineRight : ScalarIconArrowLineLeft
              "
              :label="
                isExpanded
                  ? translate('agent.collapse')
                  : translate('agent.expand')
              "
              size="md"
              @click="isExpanded = !isExpanded" />
          </span>
        </ScalarTooltip>
      </div>
      <div class="agent-scalar-panel-header-center">
        <div class="agent-scalar-panel-title">
          <ScalarIconSparkle class="agent-scalar-panel-sparkle" />
          {{ translate('agent.askAi') }}
        </div>
      </div>
      <div class="agent-scalar-panel-header-actions">
        <!-- Install MCP dropdown -->
        <div
          v-if="showMcp"
          ref="mcpListArea"
          class="agent-scalar-panel-dropdown-area">
          <button
            class="agent-scalar-panel-header-btn"
            type="button"
            @click="showMcpList = !showMcpList">
            MCP
            <ScalarIconArrowDown class="agent-scalar-panel-header-btn-icon" />
          </button>

          <div
            v-if="showMcpList"
            class="agent-scalar-panel-list">
            <component
              :is="hasConfig ? 'a' : 'button'"
              class="agent-scalar-panel-list-item"
              :href="hasConfig ? cursorLink : undefined"
              :target="hasConfig ? '_blank' : undefined"
              :type="hasConfig ? undefined : 'button'"
              @click="handleInstallClick">
              <CursorLogo class="agent-scalar-panel-list-item-icon" />
              {{ translate('mcp.installCursor') }}
            </component>
            <component
              :is="hasConfig ? 'a' : 'button'"
              class="agent-scalar-panel-list-item"
              :href="hasConfig ? vscodeLink : undefined"
              :target="hasConfig ? '_blank' : undefined"
              :type="hasConfig ? undefined : 'button'"
              @click="handleInstallClick">
              <VsCodeLogo class="agent-scalar-panel-list-item-icon" />
              {{ translate('mcp.installVsCode') }}
            </component>
            <button
              v-if="hasConfig"
              class="agent-scalar-panel-list-item"
              type="button"
              @click="
                () => {
                  copyMcpUrl()
                  showMcpList = false
                }
              ">
              <McpLogo class="agent-scalar-panel-list-item-icon" />
              {{ translate('mcp.copyUrl') }}
            </button>
            <button
              v-else
              class="agent-scalar-panel-list-item"
              type="button"
              @click="handleInstallClick">
              <McpLogo class="agent-scalar-panel-list-item-icon" />
              {{ translate('mcp.generate') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      class="agent-scalar-panel-body custom-scroll custom-scroll-self-contain-overflow">
      <AgentScalarChatInterface
        v-if="hasOpened"
        :agentScalarConfiguration
        :externalUrls
        :prefilledMessage="agentContext?.prefilledMessage"
        :workspaceStore />
    </div>
  </div>
</template>

<style scoped>
.agent-scalar-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: var(--agent-scalar-panel-width, 480px);
  max-width: 100vw;
  height: 100dvh;
  z-index: 10;
  display: flex;
  flex-direction: column;
  background: var(--scalar-background-1);
  border-left: var(--scalar-border-width) solid var(--scalar-border-color);
  box-shadow: var(--scalar-shadow-1);
  transform: translateX(100%);
  transition: width 0.3s ease;
  visibility: hidden;
}

.agent-scalar-panel--open {
  transform: translateX(0);
  transition: width 0.3s ease;
  visibility: visible;
}

.agent-scalar-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  flex-shrink: 0;
}

.agent-scalar-panel-header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.agent-scalar-panel-header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.agent-scalar-panel-header-actions {
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
}

.agent-scalar-panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--scalar-font-size-3);
  font-weight: var(--scalar-semibold);
  color: var(--scalar-color-1);
  padding: 4px 8px;
  min-height: 32px;
}

.agent-scalar-panel-sparkle {
  width: 16px;
  height: 16px;
  color: var(--scalar-color-3);
  flex-shrink: 0;
}

.agent-scalar-panel-dropdown-area {
  position: relative;
}

.agent-scalar-panel-header-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-3);
  border: none;
  background: none;
  cursor: pointer;
  padding: 4px 8px;
  height: 32px;
  border-radius: var(--scalar-radius-md);
  white-space: nowrap;
}

.agent-scalar-panel-header-btn:hover {
  background: var(--scalar-background-2);
  color: var(--scalar-color-1);
}

.agent-scalar-panel-header-btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.agent-scalar-panel-list {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: fit-content;
  max-width: 280px;
  z-index: 10;
  background: var(--scalar-background-1);
  border-radius: var(--scalar-radius-lg);
  box-shadow: var(--scalar-shadow-2);
  padding: 4px;
  white-space: nowrap;
}

.dark-mode .agent-scalar-panel-list {
  background: var(--scalar-background-2);
}

.agent-scalar-panel-list-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 8px;
  min-height: 34px;
  border: none;
  background: none;
  border-radius: var(--scalar-radius-md);
  text-decoration: none;
  cursor: pointer;
  text-align: left;
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-1);
}

.agent-scalar-panel-list-item:hover {
  background: var(--scalar-background-2);
}

.dark-mode .agent-scalar-panel-list-item:hover {
  background: var(--scalar-background-3);
}

.agent-scalar-panel-list-item:hover .agent-scalar-panel-list-item-icon {
  color: var(--scalar-color-1);
}

.agent-scalar-panel-list-item-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--scalar-color-3);
}

.agent-scalar-panel-tooltip-trigger {
  display: inline-flex;
}

.agent-scalar-panel-action-btn {
  color: var(--scalar-color-3) !important;
}

.agent-scalar-panel-action-btn:hover {
  color: var(--scalar-color-1) !important;
}

.agent-scalar-panel-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-inline: 24px;
}

/* Mobile: full-width panel */
@media (max-width: 1000px) {
  .agent-scalar-panel {
    left: 0;
    width: auto;
    border-left: none;
    z-index: 15;
  }

  .agent-scalar-panel-expand-btn {
    display: none;
  }
}
</style>
