<script setup lang="ts">
import { ScalarCodeBlock } from '@scalar/components'
import { ScalarIconCaretDown, ScalarIconCaretRight } from '@scalar/icons'
import { type DeepPartial } from 'ai'
import { computed, ref } from 'vue'

import AutosendPaused from '@/components/AutosendPaused.vue'
import RequestApproved from '@/components/RequestApproved.vue'
import RequestFailed from '@/components/RequestFailed.vue'
import RequestRejected from '@/components/RequestRejected.vue'
import RequestSuccess from '@/components/RequestSuccess.vue'
import { getMediaTypeConfig } from '@/components/ResponseBody/helpers/media-types'
import { processResponseBody } from '@/components/ResponseBody/helpers/process-response-body'
import ResponseBody from '@/components/ResponseBody/ResponseBody.vue'
import ResponseBodyToggle from '@/components/ResponseBody/ResponseBodyToggle.vue'
import SendingRequest from '@/components/SendingRequest.vue'
import type {
  ExecuteClientSideRequestToolInput,
  ExecuteClientSideRequestToolOutput,
} from '@/entities/tools/execute-request'

const { request, response, state } = defineProps<{
  request?:
    | ExecuteClientSideRequestToolInput
    | DeepPartial<ExecuteClientSideRequestToolInput>
  response?: ExecuteClientSideRequestToolOutput
  state:
    | 'requiresApproval'
    | 'sendingRequest'
    | 'requestSucceeded'
    | 'requestFailed'
    | 'approved'
    | 'rejected'
}>()

const responseData = computed(() => {
  if (response?.success) {
    return {
      data: response.data.responseBody,
      headers: response.data.headers,
    }
  }

  if (response?.error?.code === 'REQUEST_NOT_OK') {
    return {
      data: response.error.detail.responseBody,
      headers: response.error.detail.headers,
    }
  }

  return undefined
})

const showRequestToggle = ref(false)

/** Show request preview automatically for failed requests or when approval is required. */
const shouldShowRequest = computed(() => {
  if (state === 'requestFailed' || state === 'requiresApproval') {
    return true
  }
  return showRequestToggle.value
})

const responseBody = computed(() =>
  processResponseBody({
    data: responseData.value?.data,
    headers: responseData.value?.headers,
  }),
)

const mediaConfig = computed(() =>
  getMediaTypeConfig(responseBody.value.mimeType?.essence ?? ''),
)

const displayToggle = ref<'preview' | 'raw'>()
function toggleDisplay(mode: 'preview' | 'raw') {
  displayToggle.value = mode
}

const displayMode = computed(() => {
  if (displayToggle.value) return displayToggle.value

  if (mediaConfig.value?.raw && !mediaConfig.value.preview) return 'raw'
  if (mediaConfig.value?.preview) return 'preview'

  return 'raw'
})
</script>

<template>
  <div
    class="requestPreview"
    :class="{
      open: shouldShowRequest,
      succeeded: state === 'requestSucceeded',
    }">
    <RequestApproved v-if="state === 'approved'" />
    <div
      v-else-if="state === 'requiresApproval'"
      class="autosendContainer">
      <AutosendPaused />
    </div>
    <button
      v-else-if="state === 'sendingRequest'"
      class="toggleButton"
      type="button"
      @click="showRequestToggle = !showRequestToggle">
      <SendingRequest />

      <ScalarIconCaretDown v-if="shouldShowRequest" />
      <ScalarIconCaretRight v-else />
    </button>
    <button
      v-else-if="state === 'requestSucceeded'"
      class="toggleButton"
      type="button"
      @click="showRequestToggle = !showRequestToggle">
      <RequestSuccess />

      <ScalarIconCaretDown v-if="shouldShowRequest" />
      <ScalarIconCaretRight v-else />
    </button>
    <button
      v-else-if="state === 'rejected'"
      class="toggleButton"
      type="button"
      @click="showRequestToggle = !showRequestToggle">
      <RequestRejected />

      <ScalarIconCaretDown v-if="shouldShowRequest" />
      <ScalarIconCaretRight v-else />
    </button>
    <RequestFailed v-else-if="state === 'requestFailed'" />
    <div class="requestContent">
      <div class="requestContentInner">
        <div
          v-if="request"
          class="code">
          <div class="requestHeaderContainer">
            <h1>Request</h1>
          </div>
          <ScalarCodeBlock
            class="codeBlock"
            :content="JSON.stringify(request, null, 2)"
            lang="json" />
        </div>
        <div
          v-if="responseData"
          class="code">
          <div class="requestHeaderContainer">
            <h1>Response</h1>
            <ResponseBodyToggle
              v-if="mediaConfig?.raw && mediaConfig.preview"
              v-model="displayMode"
              @toggle="toggleDisplay" />
          </div>
          <ResponseBody
            :data="responseData.data"
            :display="displayMode"
            :mediaConfig="mediaConfig"
            :responseBody="responseBody" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.requestHeaderContainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5px;
}

.requestPreview {
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
}

.requestContent {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  overflow: hidden;
  transition: grid-template-rows 0.2s ease-out;
}

.requestPreview.open .requestContent {
  grid-template-rows: 1fr;
}
.requestPreview.succeeded {
  padding: 0;
}

.requestContentInner {
  min-height: 0;
  overflow: hidden;
}
.code {
  display: flex;
  flex-direction: column;
  font-size: var(--scalar-font-size-4);
  border-radius: 12px;
  background: color-mix(
    in srgb,
    var(--scalar-background-2),
    var(--scalar-background-1)
  );
  overflow: hidden;
  margin-bottom: 12px;
}
.dark-mode .code {
  background: var(--scalar-background-2);
}
.code h1 {
  font-size: var(--scalar-font-size-3);
  color: var(--scalar-color-3);
  padding: 8px;
}
.code :deep(.codeBlock) {
  max-height: calc(50vh - 100px);
  padding-top: 0;
}
.autosendContainer {
  display: flex;
  justify-content: space-between;
}

.sendButton {
  background: var(--scalar-color-blue);
  color: white;
  font-weight: var(--scalar-semibold);
  padding: 5px 10px;
}
.sendButton:hover,
.sendButton:active {
  background: color-mix(in srgb, var(--scalar-color-blue), black 10%);
  color: white !important;
}

.toggleButton {
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  position: relative;
  display: flex;
  align-items: center;
  color: var(--scalar-color-3);
  justify-content: space-between;
  border-radius: var(--scalar-radius-lg);
}

.toggleButton:hover {
  text-decoration: underline;
}
</style>
