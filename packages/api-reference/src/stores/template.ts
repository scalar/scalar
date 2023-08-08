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

type TemplateState = {
  isDark: boolean
  showSideBar: boolean
  showSearch: boolean
  activeNavState: NavState
  collapsedSidebarItems: Partial<Record<string, boolean>>
  preferredLanguage: TargetId
}

const defaultTemplateState = (): TemplateState => ({
  isDark: false,
  showSearch: false,
  showSideBar: true,
  activeNavState: NavState.Guide,
  collapsedSidebarItems: {},
  preferredLanguage: 'shell',
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
function getLanguageTitleByKey(language: TargetId | 'axios') {
  if (language === 'axios') {
    return 'JavaScript (Axios)'
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
