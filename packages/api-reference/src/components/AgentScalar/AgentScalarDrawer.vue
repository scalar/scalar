<script setup lang="ts">
import { ScalarIconX } from '@scalar/icons'
import { defineAsyncComponent } from 'vue'

import '@scalar/agent-chat/style.css'

import type { ApiReferenceConfigurationWithSource } from '@scalar/types/api-reference'
import type { WorkspaceStore } from '@scalar/workspace-store/client'
import type { WorkspaceEventBus } from '@scalar/workspace-store/events'

import { useAgentContext } from '@/hooks/use-agent'

defineProps<{
  agentScalarConfiguration: ApiReferenceConfigurationWithSource['agent']
  workspaceStore: WorkspaceStore
  eventBus: WorkspaceEventBus
}>()

const agentContext = useAgentContext()

const AgentScalarChatInterface = defineAsyncComponent(
  async () => import('./AgentScalarChatInterface.vue'),
)
</script>

<template>
  <div
    v-show="agentContext?.showAgent.value"
    class="scalar-app-exit"
    :class="agentContext?.showAgent.value ? 'scalar-app-exit-animation' : ''"
    @click="agentContext?.closeAgent()">
    <button
      class="app-exit-button zoomed:static zoomed:p-1 fixed top-2 right-2 rounded-full p-2"
      type="button">
      <ScalarIconX weight="bold" />
      <span class="sr-only">Close Client</span>
    </button>
  </div>
  <div
    v-show="agentContext?.showAgent.value"
    class="agent-scalar">
    <div
      class="agent-scalar-container custom-scroll custom-scroll-self-contain-overflow">
      <AgentScalarChatInterface
        :agentScalarConfiguration
        :prefilledMessage="agentContext?.prefilledMessage"
        :workspaceStore />
    </div>
  </div>
</template>

<style scoped>
.agent-scalar {
  position: fixed;
  top: 0;
  left: 0;
  width: calc(100% - 50px);
  height: 100dvh;
  background: var(--scalar-background-1);
  border-right: var(--scalar-border-width) solid var(--scalar-border-color);
  transform: translate3d(
    calc(-100% + var(--scalar-sidebar-width, 288px)),
    0,
    0
  );
  z-index: 2;
  animation: 0.35s forwards scalaragentslidein;
  box-shadow: var(--scalar-shadow-2);
}
.agent-scalar-container {
  width: calc(100% - var(--scalar-sidebar-width, 288px));
  height: 100%;
  margin-left: auto;
  overflow: auto;
  padding: 0 24px;
}
.scalar-app-exit {
  cursor: pointer;
  z-index: 2;
  width: 100vw;
  height: 100vh;
  transition: all 0.3s ease-in-out;
  position: fixed;
  top: 0;
  left: 0;
}
@media (max-width: 1000px) {
  .agent-scalar-container {
    width: 100%;
  }
  .agent-scalar {
    width: 100%;
    height: calc(100dvh - 50px);
    bottom: 0;
    top: initial;
    border-radius: var(--scalar-radius-lg) var(--scalar-radius-lg) 0 0;
    z-index: 12;
  }
  .scalar-app-exit {
    z-index: 11;
  }
}
.scalar-app-exit-animation:before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: #00000038;
  animation: 0.5s forwards scalardrawerexitfadein;
  animation-timing-function: cubic-bezier(0.77, 0, 0.175, 1);
}
.dark-mode .scalar .scalar-app-exit-animation:before {
  background: #00000073;
}
@keyframes scalaragentslidein {
  from {
    transform: translate3d(
      calc(-100% + var(--scalar-sidebar-width, 288px)),
      0,
      0
    );
  }
  to {
    transform: translate3d(0, 0, 0);
  }
}
@keyframes scalardrawerexitfadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.app-exit-button {
  color: white;
  background: rgba(0, 0, 0, 0.1);
}
.app-exit-button:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
