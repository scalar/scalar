<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import { computed, ref, watch } from 'vue'

import { sendRequest } from '../../helpers/sendRequest'
import { useKeyboardEvent } from '../../hooks'
import { useApiClientRequestStore } from '../../stores/apiClientRequestStore'
import { CodeMirror } from '../CodeMirror'
import FlowModal, { useModalState } from '../FlowModal.vue'
import RequestHistory from './RequestHistory.vue'

const props = defineProps<{
  proxyUrl: string
}>()

const emits = defineEmits<{
  (event: 'onSend'): void
}>()

TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

const showHistory = ref(false)
const loading = ref(false)

const {
  activeRequest,
  addRequestToHistory,
  requestHistory,
  requestHistoryOrder,
} = useApiClientRequestStore()

const historyModal = useModalState()

// https://petstore3.swagger.io/api/v3
const url = computed(() => activeRequest.url)
// GET, POST …
const requestType = computed(() => activeRequest.type)
// /pet/{petId}
const requestPath = computed(() => activeRequest.path)
// true|false
const isSmallScreen = useMediaQuery('(max-width: 820px)')

watch(activeRequest, () => {
  console.log(
    'URL',
    activeRequest.url,
    activeRequest.path,
    getShortUrl(activeRequest.url + activeRequest.path),
  )
})

// https://petstore3.swagger.io/api/v3/pet/{petId} -> /api/v3/pet/{petId}
function getShortUrl(longURL: string): string {
  try {
    const urlObject = new URL(longURL)
    const { pathname } = urlObject

    return pathname
  } catch {
    return longURL
  }
}

const formattedUrl = computed(() => {
  const fullUrl = `${url.value}${requestPath.value}`

  return isSmallScreen.value ? `...${getShortUrl(fullUrl)}` : fullUrl
})

async function send() {
  loading.value = true
  emits('onSend')
  const result = await sendRequest(activeRequest, props.proxyUrl)

  if (result) {
    addRequestToHistory(result)
  }
  loading.value = false
}

const lastRequestTimestamp = computed(() => {
  const lastRequestKey = requestHistoryOrder.value[0]
  return requestHistory[lastRequestKey]
    ? timeAgo.format(requestHistory[lastRequestKey].sentTime)
    : 'History'
})

useKeyboardEvent({
  keyList: ['enter'],
  withCtrlCmd: true,
  handler: send,
})
</script>

<template>
  <div
    class="scalar-api-client__address-bar"
    :class="{ 'scalar-api-client__address-bar__on': showHistory }">
    <div class="scalar-api-client__address-bar__address">
      <div class="request-type">
        <i :class="requestType.toLowerCase()" />
        <span>{{ requestType }}</span>
      </div>
      <CodeMirror
        class="scalar-api-client__url-input"
        :content="formattedUrl"
        :readOnly="true"
        :withPlaceholders="true" />
      <button
        class="scalar-api-client__address-bar__button"
        :class="[
          { 'scalar-api-client__address-bar__button--loading': loading },
        ]"
        type="button"
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
        <span>Send Request</span>
      </button>
    </div>
    <div
      class="scalar-api-client__address-bar__close"
      @click="showHistory = false" />
    <div class="scalar-api-client__address-bar__content">
      <FlowModal
        :state="historyModal"
        title="Request History">
        <RequestHistory
          :showHistory="showHistory"
          @toggle="showHistory = !showHistory" />
      </FlowModal>
    </div>

    <div
      v-if="requestHistoryOrder.length"
      class="scalar-api-client__history">
      <div
        class="scalar-api-client__history-toggle"
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
        <span>{{ lastRequestTimestamp }}</span>
      </div>
    </div>
  </div>
</template>
<style>
.scalar-api-client__address-bar {
  width: 100%;
  padding: 12px 12px 10px 12px;
  display: flex;
  align-items: center;
  position: relative;
  background: var(--scalar-api-client-background-primary);
}
.scalar-api-client__address-bar__address {
  display: flex;
  width: 100%;
  align-items: stretch;
  border-radius: var(--scalar-api-client-rounded);
}
.scalar-api-client__address-bar-data {
  width: 100%;
}
.scalar-api-client__address-bar-data-meta {
  display: flex;
  margin-top: 5px;
}
.request-type {
  display: flex;
  align-items: center;
  background: var(--scalar-api-client-background-secondary);
  color: var(--scalar-api-client-color-3);
  appearance: none;
  -webkit-appearance: none;
  padding: 0 12px;
  border-right: var(--scalar-api-client-border);
  border-radius: var(--scalar-api-client-rounded) 0 0
    var(--scalar-api-client-rounded);
  position: relative;
}
.request-type span {
  font-family: var(--scalar-api-client-font-code);
  font-size: 500;
  font-size: 12px;
  text-transform: uppercase;
}
.request-type svg {
  margin-left: 6px;
  width: 8px;
}
.request-type i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
  text-align: center;
  line-height: 18px;
  font-style: normal;
  flex-shrink: 0;
  display: inline-block;
  color: var(--scalar-api-client-color-3);
  background: var(--scalar-api-client-color);
}
.meta-request-break {
  margin: 0 5px;
}
.scalar-api-client__history {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  color: var(--scalar-api-client-theme-color-2);
  display: flex;
  align-items: center;
  border-radius: var(--scalar-api-client-rounded);
  height: 100%;
}
.scalar-api-client__address-bar__button {
  font-size: var(--scalar-api-client-text-xs);
  letter-spacing: 0.25px;
  line-height: 30px;
  font-weight: var(--scalar-api-client-semibold);
  color: white;
  border: none;
  white-space: nowrap;
  padding: 0 10px;
  text-transform: uppercase;
  cursor: pointer;
  outline: none;
  border-radius: 0 var(--scalar-api-client-rounded)
    var(--scalar-api-client-rounded) 0;
  background: var(--scalar-api-client-color);
  display: flex;
  align-items: center;
}
.scalar-api-client__address-bar__button svg {
  width: 12px;
  height: 12px;
  margin-right: 6px;
}
.scalar-api-client__address-bar__button--loading {
  font-size: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 127px;
}
.scalar-api-client__address-bar__button--loading svg {
  display: none;
}
.scalar-api-client__address-bar__button--loading:before {
  content: '';
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-top: 1px solid white;
  animation: urlloader 0.45s linear infinite;
  background: transparent;
  width: 14px;
  height: 14px;
  margin-left: 0;
  margin-right: 9px;
  border-radius: 50%;
}
.scalar-api-client__address-bar__button--loading:after {
  content: 'Loading';
  font-size: 12px;
}
@keyframes urlloader {
  0% {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(1turn);
  }
}
.scalar-api-client__history-toggle {
  padding: 0 9px;
  line-height: 30px;
  color: var(--scalar-api-client-color-3);
  font-size: var(--scalar-api-client-text-xs);
  letter-spacing: 0.125px;
  font-weight: var(--scalar-api-client-semibold);
  text-transform: uppercase;
  height: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  white-space: nowrap;
  border: var(--scalar-api-client-border);
  margin-left: 12px;
  border-radius: var(--scalar-api-client-rounded);
}
.scalar-api-client__history-toggle:hover {
  background: var(--scalar-api-client-background-secondary);
}
.scalar-api-client__history-toggle svg {
  height: 13px;
  width: 13px;
  margin-right: 6px;
  color: var(--scalar-api-client-color-3);
}
.scalar-api-client__address-bar-close {
  fill: var(--scalar-api-client-color-3);
  margin-left: 12px;
  height: 24px;
}
.scalar-api-client__address-bar-close:hover {
  cursor: pointer;
  fill: var(--scalar-api-client-theme-color-1);
}
.scalar-api-client__address-bar-content {
  width: 640px;
  height: 100%;
  background: --scalar-api-client-background-primary;
  box-shadow: var(--scalar-api-client-theme-shadow-2);
  position: fixed;
  top: 0;
  right: 0;
  z-index: 1000;
  transform: translate3d(640px, 0, 0);
  opacity: 0;
  transition: transform 0.5s cubic-bezier(0.77, 0, 0.175, 1),
    opacity 0.01s ease-in-out 0.5s;
  pointer-events: none;
}
.scalar-api-client__address-bar-content-item {
  height: 100vh;
  max-height: 100vh;
  overflow: auto;
}
.scalar-api-client__address-bar__on {
  z-index: 100000;
}
.scalar-api-client__address-bar__on .scalar-api-client__address-bar__content {
  transform: translate3d(0, 0, 0);
  opacity: 1;
  pointer-events: all;
  transition: transform 0.5s cubic-bezier(0.77, 0, 0.175, 1);
}
.scalar-api-client__address-bar__on .scalar-api-client__address-bar__close {
  opacity: 1;
  pointer-events: all;
  cursor: pointer;
}
.scalar-api-client__address-bar .navtable-item__active {
  background: var(--scalar-api-client-background-secondary);
  cursor: default;
}
.scalar-api-client__address-bar .navtable-item__active .radio:before {
  display: none;
}
.navigation-back {
  stroke: var(--scalar-api-client-theme-color-2);
  cursor: pointer;
}
.navigation-back:hover {
  stroke: var(--scalar-api-client-theme-color-1);
}
.scalar-api-client__address-bar__close {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  /* background: rgba(0,0,0,.55);
	 */
  pointer-events: none;
  opacity: 0;
  transition: all 0.1s ease-in-out;
  z-index: 1000;
}
.navtable-item-request span {
  padding: 8px 9px 8px 0;
  border: none;
  outline: none;
  font-size: 12px;
  color: var(--scalar-api-client-theme-color-1);
  width: 100%;
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.navtable-item-request span em {
  text-transform: uppercase;
  font-style: normal;
  font-family: var(--scalar-api-client-font-code);
  font-size: 11px;
  margin-right: 6px;
  font-weight: var(--scalar-api-client-theme-bold);
  color: var(--scalar-api-client-color-3);
}
.navtable-item-time {
  font-size: 12px;
  color: var(--scalar-api-client-theme-color-1);
  text-transform: capitalize;
  padding: 0 9px;
}
@media screen and (max-width: 720px) {
  .scalar-api-client__history-toggle span,
  .scalar-api-client__address-bar__button span {
    display: none;
  }
  .scalar-api-client__history-toggle svg,
  .scalar-api-client__address-bar__button svg {
    margin-right: 0;
  }
  .scalar-api-client__history-toggle,
  .scalar-api-client__address-bar__button {
    height: 31.5px;
    width: 31.5px;
  }
}
</style>
