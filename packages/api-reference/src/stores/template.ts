/**
 * TODO: This is a copy of projects/web/src/stores/template.ts
 */
import { type TargetId, availableTargets } from 'httpsnippet-lite'
import { reactive, readonly } from 'vue'

import { objectMerge } from '../helpers/objectMerge'
import { setItemFactory, toggleItemFactory } from './utility'

export enum NavState {
  Guide = 'Guide',
  Reference = 'Reference',
}

export type SelectedClient = { targetKey: TargetId; clientKey: string }

type TemplateState = {
  isDark: boolean
  showSideBar: boolean
  showSearch: boolean
  activeNavState: NavState
  collapsedSidebarItems: Partial<Record<string, boolean>>
  preferredLanguage: SelectedClient
}

const defaultTemplateState = (): TemplateState => ({
  isDark: false,
  showSearch: false,
  showSideBar: true,
  activeNavState: NavState.Guide,
  collapsedSidebarItems: {},
  preferredLanguage: {
    targetKey: 'shell',
    clientKey: 'curl',
  },
})

const state = reactive<TemplateState>(defaultTemplateState())

function resetState() {
  objectMerge(state, defaultTemplateState())
}

function toggleCollapsedSidebarItem(key: string) {
  state.collapsedSidebarItems[key] = !state.collapsedSidebarItems[key] ?? true
}

function setCollapsedSidebarItem(key: string, value: boolean) {
  state.collapsedSidebarItems[key] = value
}

// getLanguageTitleByKey('javascript') => 'JavaScript'
function getLanguageTitleByKey(language: TargetId | 'axios' | 'laravel') {
  if (language === 'axios') {
    return 'JavaScript (Axios)'
  } else if (language === 'laravel') {
    return 'PHP (Laravel)'
  }

  return availableTargets().find((target) => language === target.key)?.title
}

export const useTemplateStore = () => ({
  state: readonly(state),
  resetState,
  setItem: setItemFactory(state),
  toggleItem: toggleItemFactory(state),
  toggleCollapsedSidebarItem,
  setCollapsedSidebarItem,
  getLanguageTitleByKey,
})
