<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components/icon-button'
import { ScalarIconX } from '@scalar/icons'
import type {
  ApiReferenceConfigurationWithSource,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { defineAsyncComponent, ref, watch } from 'vue'

import { useAgentContext } from '@/hooks/use-agent'

defineProps<{
  agentScalarConfiguration?: ApiReferenceConfigurationWithSource['agent']
  externalUrls: ExternalUrls
  workspaceStore: WorkspaceStore
}>()

const agentContext = useAgentContext()

const AgentScalarChatInterface = defineAsyncComponent(
  async () => import('./AgentScalarChatInterface.vue'),
)

/**
 * Defer mounting the chat interface until the agent is opened for the first time.
 *
 * The chat interface mounts its own api-client modal (a hidden CodeMirror-backed
 * request editor). Rendering the drawer with `v-show` would mount that second client
 * eagerly on every agent-enabled page — including on localhost, where the agent is on
 * by default — even when the user never opens the chat. We flip this flag on first open
 * and keep it true so the chat (and its state) stays mounted once the user has used it.
 */
const hasOpenedAgent = ref(false)
watch(
  () => agentContext.value?.showAgent.value,
  (visible) => {
    if (visible) {
      hasOpenedAgent.value = true
    }
  },
)
</script>

<template>
  <Transition
    enterActiveClass="transition-opacity duration-500"
    enterFromClass="opacity-0"
    enterToClass="opacity-100"
    leaveActiveClass="transition-opacity duration-200"
    leaveFromClass="opacity-100"
    leaveToClass="opacity-0">
    <div
      v-show="agentContext?.showAgent.value"
      class="agent-scalar-overlay bg-backdrop fixed inset-0 z-10 ease-[cubic-bezier(0.77,0,0.175,1)]"
      @click="agentContext?.closeAgent()" />
  </Transition>
  <Transition
    enterActiveClass="transition-transform duration-300"
    enterFromClass="-translate-x-full"
    enterToClass="translate-x-0"
    leaveActiveClass="transition-transform duration-200"
    leaveFromClass="translate-x-0"
    leaveToClass="-translate-x-full">
    <div
      v-show="agentContext?.showAgent.value"
      class="agent-scalar left-refs-w-sidebar bg-b-1 fixed inset-y-0 right-12 z-10 grid border-r shadow-lg"
      @keydown.escape="agentContext?.closeAgent()">
      <div
        class="agent-scalar-container custom-scroll custom-scroll-self-contain-overflow overflow-auto px-6">
        <AgentScalarChatInterface
          v-if="hasOpenedAgent"
          :agentScalarConfiguration
          :externalUrls
          :prefilledMessage="agentContext?.prefilledMessage"
          :workspaceStore />
      </div>
      <ScalarIconButton
        class="agent-scalar-exit-button absolute top-2 right-2"
        :icon="ScalarIconX"
        label="Close Client"
        weight="bold"
        @click="agentContext?.closeAgent()" />
    </div>
  </Transition>
</template>

<style scoped>
@reference "../../style.css";

@media (max-width: 1000px) {
  .agent-scalar.agent-scalar {
    @apply inset-x-0 top-12 rounded-t-lg;
  }
  .agent-scalar.agent-scalar,
  .agent-scalar-overlay.agent-scalar-overlay {
    @apply z-15;
  }
}
</style>
