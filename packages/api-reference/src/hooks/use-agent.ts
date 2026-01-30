import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import type { ComputedRef, Ref } from 'vue'
import { type InjectionKey, computed, inject, ref } from 'vue'

/**
 * Config list shape needed to determine if the agent is enabled for the active document.
 * Compatible with NormalizedConfigurations from normalize-configurations.
 */
export type AgentConfigList = Record<string, { agent?: unknown }>

export type UseAgentOptions = {
  configList: Ref<AgentConfigList> | ComputedRef<AgentConfigList>
  activeSlug: Ref<string>
}

export type UseAgentReturn = {
  showAgent: Ref<boolean>
  agentEnabled: ComputedRef<boolean>
  /** Ref used to pass a prefill message into the agent when opening. Cleared on close. */
  prefilledMessage: Ref<string>
  openAgent: (message?: string) => void
  closeAgent: () => void
  toggleAgent: () => void
}

/**
 * Hook for agent visibility and enabled state.
 * Use in the API Reference root to control the agent panel and allow child components to open it.
 *
 * Returns:
 * - showAgent: whether the agent panel is visible
 * - agentEnabled: whether the agent is enabled (local URL or config.agent for active document)
 * - openAgent, closeAgent, toggleAgent: imperative controls
 */
export function useAgent(options: UseAgentOptions): UseAgentReturn {
  const showAgent = ref(false)
  const prefilledMessage = ref('')

  const agentEnabled = computed(() => {
    if (isLocalUrl(window.location.href)) {
      return true
    }
    return Boolean(options.configList.value[options.activeSlug.value]?.agent)
  })

  const openAgent = (message?: string) => {
    prefilledMessage.value = message ?? ''
    showAgent.value = true
  }

  const closeAgent = () => {
    showAgent.value = false
    prefilledMessage.value = ''
  }

  const toggleAgent = () => {
    showAgent.value = !showAgent.value
    if (!showAgent.value) {
      prefilledMessage.value = ''
    }
  }

  return {
    showAgent,
    agentEnabled,
    prefilledMessage,
    openAgent,
    closeAgent,
    toggleAgent,
  }
}

export const AGENT_CONTEXT_SYMBOL = Symbol() as InjectionKey<UseAgentReturn>

/**
 * Inject the agent context provided by ApiReference.
 * Use in child components (e.g. AskAgentButton) to open the agent or check if it is enabled.
 *
 * Returns undefined when used outside an ApiReference that provides the agent context.
 */
export function useAgentContext(): UseAgentReturn | undefined {
  return inject(AGENT_CONTEXT_SYMBOL)
}
