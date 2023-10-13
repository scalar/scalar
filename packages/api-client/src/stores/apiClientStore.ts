import { reactive, readonly } from 'vue'

export type SidebarIdVisibility = Record<string, boolean>

type State = {
  showApiClient: boolean
  activeApiClientEndpointId: string
  activeItem: any
  snippetType: string
  activeSidebar: string
  sidebarIdVisibility: SidebarIdVisibility
}

function defaultState(): State {
  return {
    showApiClient: false,
    activeApiClientEndpointId: '',
    activeItem: {},
    snippetType: 'javascript',
    activeSidebar: '',
    sidebarIdVisibility: {},
  }
}

const state = reactive<State>(defaultState())

function toggleApiClient(item?: any, forceShow = false) {
  if (forceShow) {
    state.showApiClient = true
  } else {
    state.showApiClient = !state.showApiClient
  }
  if (item) {
    state.activeItem = item
  }
}

function hideApiClient() {
  state.showApiClient = false
}

function setActiveApiClientEndpointId(id: string) {
  state.activeApiClientEndpointId = id
}

function setSnippetType(type: string) {
  state.snippetType = type
}

function setActiveSidebar(item: string) {
  state.activeSidebar = item
}

function setSidebarIdVisibility(id: string, visible: boolean) {
  state.sidebarIdVisibility[id] = visible
}

export const useApiClientStore = () => ({
  state: readonly(state),
  toggleApiClient,
  setActiveApiClientEndpointId,
  setSnippetType,
  setActiveSidebar,
  setSidebarIdVisibility,
  hideApiClient,
})
