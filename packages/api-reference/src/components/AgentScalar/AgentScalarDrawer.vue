<script setup lang="ts">
import { ScalarIconButton } from '@scalar/components'
import { ScalarIconX } from '@scalar/icons'
import type {
  ApiReferenceConfigurationWithSource,
  ExternalUrls,
} from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import { defineAsyncComponent } from 'vue'

import { useAgentContext } from '@/hooks/use-agent'

defineProps<{
  agentScalarConfiguration: ApiReferenceConfigurationWithSource['agent']
  externalUrls: ExternalUrls
  workspaceStore: WorkspaceStore
}>()

const agentContext = useAgentContext()

const AgentScalarChatInterface = defineAsyncComponent(
  async () => import('./AgentScalarChatInterface.vue'),
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
      class="agent-scalar left-w-sidebar bg-b-1 fixed inset-y-0 right-12 z-10 grid border-r shadow-lg"
      @keydown.escape="agentContext?.closeAgent()">
      <div
        class="agent-scalar-container custom-scroll custom-scroll-self-contain-overflow overflow-auto px-6">
        <AgentScalarChatInterface
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
