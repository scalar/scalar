<script setup lang="ts">
import { CodeMirror } from '@scalar/use-codemirror'
import { FlowModal, useModal } from '@scalar/use-modal'
import { isMacOS } from '@scalar/use-tooltip'
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed, ref } from 'vue'

import {
  humanDiff,
  prepareClientRequestConfig,
  sendRequest,
} from '../../helpers'
import { useRequestStore } from '../../stores'
import RequestHistory from './RequestHistory.vue'
import RequestMethodSelect from './RequestMethodSelect.vue'

const props = defineProps<{
  proxyUrl?: string
}>()

const emits = defineEmits<{
  (event: 'onSend'): void
}>()

const keys = useMagicKeys()
whenever(isMacOS() ? keys.meta_enter : keys.ctrl_enter, send)

const showHistory = ref(false)
const loading = ref(false)

const {
  activeRequest,
  addRequestToHistory,
  requestHistory,
  requestHistoryOrder,
  readOnly,
  setActiveRequest,
} = useRequestStore()

const historyModal = useModal()

// https://petstore3.swagger.io/api/v3
const url = computed(() => activeRequest.url)
// GET, POST …
const requestType = computed(() => activeRequest.type)
// /pet/{petId}
const requestPath = computed(() => activeRequest.path)
// true|false
// const isSmallScreen = useMediaQuery('(max-width: 820px)')

// TODO: This should probably be a CodeMirror plugin? It doesn’t work to just replace the URL.
// https://petstore3.swagger.io/api/v3/pet/{petId} -> /api/v3/pet/{petId}
// function getShortUrl(longURL: string): string {
//   try {
//     const urlObject = new URL(longURL)
//     const { pathname } = urlObject

//     return pathname
//   } catch {
//     return longURL
//   }
// }

const formattedUrl = computed(() => {
  return `${url.value}${requestPath.value}`
})

async function send() {
  const clientRequestConfig = prepareClientRequestConfig({
    request: { ...activeRequest },
  })
  loading.value = true
  emits('onSend')
  const result = await sendRequest(clientRequestConfig, props.proxyUrl)

  if (result) {
    addRequestToHistory(result)
  }
  loading.value = false
}

const onChange = (value: string) => {
  if (readOnly.value) {
    return
  }

  if (activeRequest.url + activeRequest.path === value) {
    return
  }

  // The address is actually two values (URL + path). But we only have one value in the address bar.
  // So we need to reset path, and just put everything into URL.
  // TODO: This will bite us if we ever want to store the data and switch between environments (base URLs).
  setActiveRequest({ ...activeRequest, url: value, path: '' })
}

const handleRequestMethodChanged = (requestMethod?: string) => {
  if (requestMethod) {
    setActiveRequest({
      ...activeRequest,
      type: requestMethod.toLocaleLowerCase(),
    })
  }
}
</script>

<template>
  <div
    v-if="loading"
    class="loader"></div>
  <div
    class="address-bar"
    :class="{ 'address-bar--with-history': showHistory }">
    <div class="url-form">
      <div class="url-form-field">
        <RequestMethodSelect
          :readOnly="readOnly"
          :requestMethod="requestType"
          @change="handleRequestMethodChanged" />
        <div class="url-form-input-wrapper cm-scroller">
          <div class="url-form-input-fade__left"></div>
          <CodeMirror
            class="url-form-input"
            :content="formattedUrl"
            disableEnter
            :readOnly="readOnly"
            withoutTheme
            withVariables
            @change="onChange" />
          <div class="url-form-input-fade__right"></div>
        </div>
        <div
          v-if="requestHistoryOrder.length"
          class="history">
          <div
            class="history-toggle"
            @click="historyModal.show()">
            <svg
              fill="none"
              height="48"
              viewBox="0 0 14 14"
              width="48"
              xmlns="http://www.w3.org/2000/svg">
              <g id="rewind-clock--back-return-clock-timer-countdown">
                <path
                  id="Vector 1561 (Stroke)"
                  clip-rule="evenodd"
                  d="M6.99999 2.75C7.4142 2.75 7.74999 3.08579 7.74999 3.5V7.5C7.74999 7.76345 7.61177 8.00758 7.38586 8.14312L4.88586 9.64312C4.53068 9.85623 4.06998 9.74106 3.85687 9.38587C3.64376 9.03069 3.75893 8.56999 4.11412 8.35688L6.24999 7.07536V3.5C6.24999 3.08579 6.58578 2.75 6.99999 2.75Z"
                  fill="currentColor"
                  fill-rule="evenodd"></path>
                <path
                  id="Union"
                  clip-rule="evenodd"
                  d="M12.5 7C12.5 3.96243 10.0376 1.5 7 1.5C5.24916 1.5 3.68853 2.31796 2.68066 3.59456L3.64645 4.56034C3.96143 4.87533 3.73835 5.4139 3.29289 5.4139H0.5C0.223857 5.4139 0 5.19004 0 4.9139V2.121C0 1.67555 0.53857 1.45247 0.853553 1.76745L1.61439 2.52829C2.89781 0.984301 4.83356 0 7 0C10.866 0 14 3.13401 14 7C14 10.866 10.866 14 7 14C3.68902 14 0.916591 11.702 0.187329 8.61473C0.0921059 8.21161 0.341704 7.80762 0.744824 7.7124C1.14794 7.61717 1.55193 7.86677 1.64715 8.26989C2.22013 10.6955 4.40025 12.5 7 12.5C10.0376 12.5 12.5 10.0376 12.5 7Z"
                  fill="currentColor"
                  fill-rule="evenodd"></path>
              </g>
            </svg>
          </div>
        </div>
        <button
          class="send-button"
          :disabled="!formattedUrl.trim().length"
          type="submit"
          @click="send">
          <svg
            fill="none"
            height="48"
            viewBox="0 0 14 14"
            width="48"
            xmlns="http://www.w3.org/2000/svg">
            <g id="send-email--mail-send-email-paper-airplane">
              <path
                id="Subtract"
                clip-rule="evenodd"
                d="M11.8215 0.0977331C12.1097 -0.0075178 12.422 -0.0287134 12.7219 0.0367172C13.0248 0.102803 13.3024 0.254481 13.5216 0.473719C13.7409 0.692957 13.8926 0.970537 13.9586 1.27346C14.0241 1.57338 14.0029 1.88566 13.8976 2.17389L10.3236 12.8859L10.3234 12.8866C10.2363 13.15 10.083 13.3867 9.87813 13.5739C9.67383 13.7606 9.42512 13.8917 9.15575 13.9549C8.88633 14.0206 8.60444 14.015 8.33777 13.9388C8.07134 13.8627 7.82929 13.7187 7.63532 13.5209L5.71798 11.6123L3.70392 12.6538C3.54687 12.735 3.3586 12.7272 3.20877 12.6333C3.05895 12.5395 2.96984 12.3734 2.97443 12.1967L3.057 9.01294L10.102 3.89553C10.3812 3.69267 10.4432 3.30182 10.2403 3.02255C10.0375 2.74327 9.64662 2.68133 9.36734 2.88419L2.20286 8.0884L0.473156 6.35869L0.473098 6.35864L0.472971 6.35851C0.285648 6.17132 0.147746 5.94054 0.0716498 5.68688C-0.00390565 5.43503 -0.016181 5.16847 0.0358684 4.91079C0.087985 4.62928 0.213827 4.36658 0.400607 4.14951C0.588668 3.93095 0.831681 3.76658 1.10453 3.67339L1.1079 3.67224L1.1079 3.67225L11.8215 0.0977331Z"
                fill="currentColor"
                fill-rule="evenodd"></path>
            </g>
          </svg>
          <span>Send</span>
        </button>
      </div>
    </div>
    <div
      class="address-bar-close"
      @click="showHistory = false" />
    <div class="address-bar-content">
      <FlowModal
        :state="historyModal"
        title="Request History"
        variant="history">
        <RequestHistory
          :showHistory="showHistory"
          @toggle="showHistory = !showHistory" />
      </FlowModal>
    </div>
  </div>
</template>

<style>
.api-client-url-variable {
  color: var(--scalar-api-client-color);
}
</style>

<style scoped>
.loader {
  position: absolute;
  z-index: 3;
  height: 2px;
  background: var(--scalar-api-client-color);
  animation: loading 5s cubic-bezier(0, 0.5, 0.25, 1);
}
@keyframes loading {
  0% {
    width: 0;
  }
  100% {
    width: 100%;
  }
}
.address-bar {
  width: 100%;
  padding: 10px;
  display: flex;
  align-items: center;
  position: relative;
}
.url-form {
  display: flex;
  width: 720px;
  align-items: stretch;
  border-radius: var(--scalar-radius-lg);
  max-width: 720px;
  margin: auto;
  z-index: 2;
  max-width: calc(100% - 68px);
}
.url-form:deep(.cm-content) {
  display: flex;
  align-items: center;
}
.url-form-field {
  align-items: stretch;
  border: 1px solid var(--scalar-border-color);
  border-radius: var(--scalar-radius);
  display: flex;
  min-height: 31px;
  overflow: hidden;
  padding: 2px;
  width: 100%;
}
.url-form-input-wrapper {
  display: flex;
  position: relative;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  scroll-timeline: --scroll-timeline x;
  /* Firefox supports */
  scroll-timeline: --scroll-timeline horizontal;
}
.url-form-input {
  background: var(--scalar-background-1);
  color: var(--scalar-color-1);
  font-weight: var(--scalar-semibold);
  min-height: auto;
  min-width: fit-content;
  padding-top: 0;
  position: relative;
  max-width: calc(100% - 153px);
  margin-right: auto;
}
.url-form-input-fade__left,
.url-form-input-fade__right {
  content: '';
  position: sticky;
  height: 100%;
  animation-name: fadein;
  animation-duration: 1ms;
  animation-direction: reverse;
  animation-timeline: --scroll-timeline;
  z-index: 1;
}
.url-form-input-fade__left {
  background: linear-gradient(
    -90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 30%,
    var(--scalar-background-1) 100%
  );
  left: 0;
  min-width: 6px;
}
.url-form-input-fade__right {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 30%,
    var(--scalar-background-1) 100%
  );
  right: 0;
  min-width: 24px;
  animation-direction: reverse;
}
@keyframes fadein {
  0% {
    opacity: 0;
  }
  2% {
    opacity: 1;
  }
}
@media screen and (max-width: 720px) {
  .url-form-input {
    max-width: calc(100% - 113px);
  }
}
.url-form-input :deep(.cm-scroller) {
  overflow-y: hidden;
}
.url-form-input :deep(.cm-line) {
  font-size: var(--scalar-micro);
  padding: 0;
}
.history {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  color: var(--scalar-color-2);
  display: flex;
  align-items: center;
  border-radius: var(--scalar-radius);
}

.send-button[type='submit'] {
  font-size: var(--scalar-micro);
  letter-spacing: 0.25px;
  color: var(--scalar-button-1-color);
  border: none;
  white-space: nowrap;
  padding: 0 9px;
  cursor: pointer;
  outline: none;
  font-family: var(--scalar-font);
  font-weight: var(--scalar-semibold);
  border-radius: var(--scalar-radius);
  background: var(--scalar-button-1);
  position: relative;
  display: flex;
  align-items: center;
  overflow: hidden;
  flex-shrink: 0;
}
.send-button:hover {
  background: var(--scalar-button-1-hover);
}
.send-button svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  margin-right: 6px;
  position: relative;
}

.send-button span {
  position: relative;
}
@media screen and (max-width: 720px) {
  .history-toggle span,
  .send-button span {
    display: none;
  }
  .history-toggle svg,
  .send-button svg {
    margin-right: 0;
  }
}
.send-button[disabled] {
  pointer-events: none;
  color: var(--scalar-color-2);
  background: var(--scalar-background-3);
  border: 1px solid var(--scalar-border-color);
}
.history-toggle {
  padding: 7px;
  line-height: 30px;
  color: var(--scalar-color-3);
  font-size: var(--scalar-micro);
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  white-space: nowrap;
  border-radius: var(--scalar-radius);
  user-select: none;
  border-radius: var(--scalar-radius);
  margin-right: 4px;
  transition:
    background-color 0.15s ease-in-out,
    color 0.15s ease-in-out;
}
.history-toggle:hover {
  background-color: var(--scalar-background-2);
  color: var(--scalar-color-1);
}
.history-toggle svg {
  height: 13px;
  width: 13px;
  color: currentColor;
}
.address-bar-content {
  width: 640px;
  height: 100%;
  background: var(--scalar-background-1);
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  transform: translate3d(640px, 0, 0);
  opacity: 0;
  transition:
    transform 0.5s cubic-bezier(0.77, 0, 0.175, 1),
    opacity 0.01s ease-in-out 0.5s;
  pointer-events: none;
}
.address-bar--with-history {
  z-index: 100000;
}
.address-bar--with-history .address-bar-content {
  transform: translate3d(0, 0, 0);
  opacity: 1;
  pointer-events: all;
  transition: transform 0.5s cubic-bezier(0.77, 0, 0.175, 1);
}
.address-bar--with-history .address-bar-close {
  opacity: 1;
  pointer-events: all;
  cursor: pointer;
}
.address-bar-close {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  opacity: 0;
  transition: all 0.1s ease-in-out;
  z-index: 1000;
}
</style>
