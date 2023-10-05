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
  Object.assign(activeRequest, request)
}

// Get the currently active response
const activeResponse = computed(() =>
  activeRequestId.value ? requestHistory[activeRequestId.value].response : null,
)

// Set the active request object
const setActiveRequest = (request: ClientRequestConfig) => {
  Object.assign(activeRequest, request)
}

/**
 * View state
 */

// Whether the request is in read mode or edit mode
const readOnly = ref(true)

export const useApiClientRequestStore = () => ({
  readOnly,
  activeRequest,
  activeResponse,
  requestHistory,
  requestHistoryOrder,
  activeRequestId,
  setActiveResponse,
  addRequestToHistory,
  setActiveRequest,
})
