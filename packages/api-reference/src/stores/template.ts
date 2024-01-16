/**
 * TODO: This is a copy of projects/web/src/stores/template.ts
 */
import { type TargetId } from 'httpsnippet-lite'
import { reactive, readonly } from 'vue'

import { objectMerge } from '../helpers'
import { useSnippetTargets } from '../hooks'
import { setItemFactory, toggleItemFactory } from './utility'

export enum NavState {
  Guide = 'Guide',
  Reference = 'Reference',
}

export type SelectedClient = { targetKey: TargetId; clientKey: string }

type TemplateState = {
  isDark: boolean
  activeNavState: NavState
  selectedClient: SelectedClient
}

const defaultTemplateState = (): TemplateState => ({
  isDark: false,
  activeNavState: NavState.Guide,
  selectedClient: {
    targetKey: 'shell',
    clientKey: 'curl',
  },
})

const state = reactive<TemplateState>(defaultTemplateState())

function resetState() {
  objectMerge(state, defaultTemplateState())
}

// Gets the client title from the availableTargets
// { targetKey: 'shell', clientKey: 'curl' } -> 'Shell'
function getTargetTitle(client: SelectedClient) {
  const { availableTargets } = useSnippetTargets()
  return (
    availableTargets.value.find((target) => target.key === client.targetKey)
      ?.title ?? client.targetKey
  )
}

// Gets the client title from the availableTargets
// { targetKey: 'shell', clientKey: 'curl' } -> 'cURL'
function getClientTitle(client: SelectedClient) {
  const { availableTargets } = useSnippetTargets()
  return (
    availableTargets.value
      .find((target) => target.key === client.targetKey)
      ?.clients.find((item) => item.key === client.clientKey)?.title ??
    client.clientKey
  )
}

export const useTemplateStore = () => ({
  state: readonly(state),
  resetState,
  setItem: setItemFactory(state),
  toggleItem: toggleItemFactory(state),
  getClientTitle,
  getTargetTitle,
})
