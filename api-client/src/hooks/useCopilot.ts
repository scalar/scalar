import { useWebSocket } from '@vueuse/core'
import { reactive, readonly } from 'vue'

export enum CopilotLoadingStates {
  Inactive = 'Inactive',
  Fix = 'Fix',
  Loading = 'Loading',
  Working = 'Working',
  Success = 'Success',
}

export type RequestData = {
  id: string
  request: string
}
export type RecommendationHandler = (recommendation: string) => void

const recommendationHandler: Set<RecommendationHandler> = new Set([])

function onMessage(_ws: WebSocket, event: MessageEvent) {
  const jsonData = JSON.parse(event.data)
  const recommendation = jsonData['response']
  recommendationHandler.forEach((handler) => handler(recommendation))
}

const { send } = useWebSocket(import.meta.env.VITE_COPILOT_WS_URL, {
  onMessage,
  autoReconnect: true,
})

function sendCopilot(requestData: RequestData) {
  setLoadingState(CopilotLoadingStates.Loading)
  const jsonString = JSON.stringify(requestData)
  send(jsonString)
}

const serverHandler = () => ({
  uuid: '',
  curlRequest:
    "curl -X 'GET' 'https://petstore.swagger.io/v2/pet/findByStatus?status=SOld' -H 'accept: application/json'",
})

const serverHandlerState = reactive(serverHandler())

const state = reactive({
  loadingState: CopilotLoadingStates.Inactive,
})

function setLoadingState(loadingState: CopilotLoadingStates) {
  state.loadingState = loadingState
}

/**
 * This hook is used to send requests to the copilot server and receive recommendations.
 */
export const useCopilot = () => ({
  sendCopilot,
  state: readonly(state),
  onRecommendation: (handler: RecommendationHandler) => {
    recommendationHandler.add(handler)
  },
  serverHandlerState,
  setLoadingState,
})
