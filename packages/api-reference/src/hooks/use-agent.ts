import { isLocalUrl } from '@scalar/helpers/url/is-local-url'
import type { ComputedRef, Ref } from 'vue'
import { type InjectionKey, computed, inject, nextTick, ref } from 'vue'

type UseAgentOptions = {
  /** Optional. When provided, controls whether the agent UI is enabled (e.g. from doc config). Defaults to isLocalUrl. */
  agentEnabled?: ComputedRef<boolean>
}

type UseAgentReturn = {
  showAgent: Ref<boolean>
  agentEnabled: ComputedRef<boolean>
  /** Ref used to pass a prefill message into the agent when opening. Cleared on close. */
  prefilledMessage: Ref<string>
  openAgent: (message?: string) => void
  closeAgent: () => void
  toggleAgent: () => void
}

export const AGENT_CONTEXT_SYMBOL = Symbol() as InjectionKey<UseAgentReturn>

/**
 * Module-level ref so useAgentContext() can resolve context even when inject fails
 * (e.g. async component boundary or mount order). Set when ApiReference calls useAgent().
 */
const agentStateRef: Ref<UseAgentReturn | null> = ref(null)

/**
 * Hook for agent visibility and enabled state.
 * Call from the API Reference root (e.g. ApiReference.vue) with options to create the state, then provide it so descendants can inject it.
 *
 * Returns:
 * - showAgent: whether the agent panel is visible
 * - agentEnabled: whether the agent is enabled
 * - openAgent, closeAgent, toggleAgent: imperative controls
 */
export function useAgent(options: UseAgentOptions): UseAgentReturn {
  const showAgent = ref(false)
  const prefilledMessage = ref('')

  const agentEnabled = options.agentEnabled ?? computed(() => isLocalUrl(window.location.href))

  /**
   * What had focus when the panel opened. Closing (via Escape, the close
   * button or a toggle) returns focus here so keyboard users are not dropped at
   * the top of the document.
   */
  let previouslyFocused: HTMLElement | null = null

  const openAgent = (message?: string) => {
    // Only capture on a real open, so re-opening an already-open panel does not
    // overwrite the trigger with something inside the panel.
    if (!showAgent.value && typeof document !== 'undefined') {
      previouslyFocused = document.activeElement as HTMLElement | null
    }
    prefilledMessage.value = message ?? ''
    showAgent.value = true
  }

  const closeAgent = () => {
    showAgent.value = false
    prefilledMessage.value = ''

    // Restore after the DOM settles: the main content is `inert` while the
    // panel is open, so the trigger cannot take focus until that clears.
    const target = previouslyFocused
    previouslyFocused = null
    if (target) {
      void nextTick(() => {
        if (target.isConnected) {
          target.focus()
        }
      })
    }
  }

  const toggleAgent = () => {
    if (showAgent.value) {
      closeAgent()
    } else {
      openAgent()
    }
  }

  const state: UseAgentReturn = {
    showAgent,
    agentEnabled,
    prefilledMessage,
    openAgent,
    closeAgent,
    toggleAgent,
  }
  agentStateRef.value = state
  return state
}

/**
 * Inject the agent context provided by ApiReference.
 * Falls back to module-level state when inject is undefined (e.g. async boundary or mount order).
 * Use in descendant components (e.g. AskAgentButton) to open the agent or check if it is enabled.
 *
 * Returns a computed ref; use v-if="agentContext?.agentEnabled" so the button only renders when context exists and agent is enabled.
 */
export function useAgentContext(): ComputedRef<UseAgentReturn | undefined> {
  const injected = inject(AGENT_CONTEXT_SYMBOL, undefined)
  return computed((): UseAgentReturn | undefined => injected ?? agentStateRef.value ?? undefined)
}
