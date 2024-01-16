import { reactive, readonly } from 'vue'

type State = {
  showApiClient: boolean
  activeApiClientEndpointId: string
  activeItem: any
  snippetType: string
}

function defaultState(): State {
  return {
    showApiClient: false,
    activeApiClientEndpointId: '',
    activeItem: {},
    snippetType: 'javascript',
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

export const useApiClientStore = () => ({
  state: readonly(state),
  toggleApiClient,
  setActiveApiClientEndpointId,
  setSnippetType,
  hideApiClient,
})
