import { reactive, readonly } from 'vue'

type State = {
  showApiClient: boolean
  activeApiClientEndpointId: string
  snippetType: string
}

function defaultState(): State {
  return {
    showApiClient: false,
    activeApiClientEndpointId: '',
    snippetType: 'javascript',
  }
}

const state = reactive<State>(defaultState())

function toggleApiClient(forceShow = false) {
  state.showApiClient = forceShow || !state.showApiClient
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
