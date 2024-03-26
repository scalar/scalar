import { computed, reactive, ref } from 'vue'

import { createPlaceholderRequest } from '../helpers/createPlaceholderRequest'
import type { ClientRequestConfig, RequestResult } from '../types'

/**
 * Request state
 */
type RequestHistoryOrder = string[]
type RequestHistoryEntry = RequestResult

// Log of all requests made
const requestHistory: Record<string, RequestHistoryEntry> = reactive({})

// Request list order
const requestHistoryOrder = ref<RequestHistoryOrder>([])

// Id of the currently viewed request
const activeRequestId = ref('')

// Active request object
const activeRequest = reactive(createPlaceholderRequest())

/**
 * Mutators
 */

// Add a new request to the history log and make it active
const addRequestToHistory = (value: RequestHistoryEntry) => {
  requestHistory[value.responseId] = value
  activeRequestId.value = value.responseId
  requestHistoryOrder.value.unshift(value.responseId)
}

// Set a response by key to currently active
const setActiveResponse = (historyID: string) => {
  activeRequestId.value = historyID
  const { request }: { request: ClientRequestConfig } =
    requestHistory[historyID]

  // we need to ensure body is a string again
  // for codemirror
  const req = JSON.parse(JSON.stringify(request))
  req.body = JSON.stringify(request.body, null, 2)

  Object.assign(activeRequest, req)
}

// Get the currently active response
const activeResponse = computed(() =>
  activeRequestId.value ? requestHistory[activeRequestId.value].response : null,
)

// Set the active request object
const setActiveRequest = (request: ClientRequestConfig) => {
  Object.assign(activeRequest, request)
}

// Empty the active response
const resetActiveResponse = () => {
  activeRequestId.value = ''
}

/**
 * View state
 */

// Whether the request is in read mode or edit mode
const readOnly = ref(true)

export const useRequestStore = () => ({
  readOnly,
  activeRequest,
  activeResponse,
  requestHistory,
  requestHistoryOrder,
  activeRequestId,
  setActiveResponse,
  resetActiveResponse,
  addRequestToHistory,
  setActiveRequest,
})
