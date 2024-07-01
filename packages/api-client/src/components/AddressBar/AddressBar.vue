<script setup lang="ts">
import { executeRequestBus } from '@/libs'
import { useWorkspace } from '@/store/workspace'
import { Listbox } from '@headlessui/vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { REQUEST_METHODS, type RequestMethod } from '@scalar/oas-utils/helpers'
import { isMacOS } from '@scalar/use-tooltip'
import { useMagicKeys, whenever } from '@vueuse/core'
import { ref, watch } from 'vue'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import AddressBarHistory from './AddressBarHistory.vue'
import AddressBarServer from './AddressBarServer.vue'

const {
  activeRequest,
  activeExample,
  requestMutators,
  requestsHistory,
  workspace,
} = useWorkspace()

const history = requestsHistory
const selectedRequest = ref(history.value[0])

const keys = useMagicKeys()
whenever(isMacOS() ? keys.meta_enter : keys.ctrl_enter, () =>
  executeRequestBus.emit(),
)

// watch(
//   () => activeInstance.value?.url,
//   (newURL, oldURL) => {
//     if (!activeRequest.value) return
//
//     const toUpdate = syncPathParamsFromURL(
//       newURL,
//       oldURL,
//       activeInstance.value?.parameters.path,
//     )
//     if (toUpdate)
//       updateRequestInstance(
//         activeRequest.value.uid,
//         activeInstanceIdx,
//         toUpdate.key,
//         toUpdate.value,
//       )
//   },
// )
//
/** update the instance path parameters on change */
const onUrlChange = (newPath: string) => {
  if (!activeRequest.value) return

  requestMutators.edit(activeRequest.value.uid, 'path', newPath)
}

/** watch for changes in the URL */
watch(
  () => activeRequest.value?.path,
  (newURL) => {
    if (!activeRequest.value) return
    onUrlChange(newURL)
  },
)

const percentage = ref(100)
const isRequesting = ref(false)

executeRequestBus.on(() => {
  if (isRequesting.value) return
  isRequesting.value = true

  const interval = setInterval(() => {
    percentage.value -= 5
    if (percentage.value <= 0) {
      clearInterval(interval)
      percentage.value = 100
      isRequesting.value = false
    }
  }, 20)
})

function updateRequestMethod(method: RequestMethod) {
  if (!activeRequest.value) return
  requestMutators.edit(activeRequest.value.uid, 'method', method)
}

function getBackgroundColor() {
  if (!activeRequest.value) return undefined
  const { method } = activeRequest.value
  return REQUEST_METHODS[method as RequestMethod].backgroundColor
}

/** prevent line breaks on pasted content */
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  const sanitizedText = text.replace(/\n/g, '')

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  range.deleteContents()
  const textNode = document.createTextNode(sanitizedText)
  range.insertNode(textNode)

  /** move the cursor to the end of the inserted text */
  range.setStartAfter(textNode)
  selection.removeAllRanges()
  selection.addRange(range)

  /** scroll and focus at the end of the pasted content */
  const editableDiv = range.startContainer.parentElement
  if (editableDiv) {
    editableDiv.scrollLeft = editableDiv.scrollWidth
  }
}

/**
 * TODO: This component is pretty much mocked for now, will come back and finish it up once we
 * Start making requests and adding some history
 */
</script>
<template>
  <div
    v-if="activeRequest && activeExample"
    class="order-last lg:order-none lg:w-auto w-full">
    <!-- <div class="text-c-2 flex w-80 flex-row items-center gap-1 p-4">
      <ScalarIcon
        icon="Branch"
        size="md" />
      <h2 class="text-sm">Branch Name</h2>
    </div> -->

    <div class="m-auto flex basis-1/2 flex-row items-center">
      <!-- Address Bar -->
      <Listbox
        v-slot="{ open }"
        v-model="selectedRequest">
        <div
          :class="[
            'text-xxs bg-b-1 relative flex w-full lg:min-w-[720px] lg:max-w-[720px] order-last lg:order-none flex-1 flex-row items-stretch rounded border p-[3px]',
            { 'rounded-b-none': open },
            { 'border-transparent': open },
          ]">
          <div
            class="pointer-events-none absolute left-0 top-0 z-10 block h-full w-full overflow-hidden">
            <div
              class="bg-mix-transparent bg-mix-amount-95 absolute left-0 top-0 h-full w-full"
              :class="getBackgroundColor()"
              :style="{ transform: `translate3d(-${percentage}%,0,0)` }"></div>
          </div>
          <div class="flex gap-1">
            <HttpMethod
              class="font-code text-xxs font-medium"
              :isEditable="!workspace.isReadOnly"
              isSquare
              :method="activeRequest.method"
              @change="updateRequestMethod" />
            <AddressBarServer :workspace="workspace" />
          </div>
          <div class="custom-scroll scroll-timeline-x relative flex w-full">
            <div class="fade-left"></div>

            <!-- TODO wrap vars in spans for special effects like mouseOver descriptions -->
            <div
              class="scroll-timeline-x-address font-code text-c-1 flex flex-1 items-center whitespace-nowrap lg:text-sm text-xs font-medium leading-[24.5px] outline-none"
              :contenteditable="!workspace.isReadOnly"
              @input="(ev) => onUrlChange((ev.target as HTMLElement).innerText)"
              @keydown.enter.prevent="executeRequestBus.emit()"
              @paste="handlePaste">
              {{ activeRequest.path }}
            </div>
            <div class="fade-right"></div>
          </div>

          <AddressBarHistory :open="open" />
          <ScalarButton
            class="relative h-auto shrink-0 gap-1.5 overflow-hidden px-2.5 py-1 z-[1]"
            :disabled="isRequesting"
            @click="executeRequestBus.emit()">
            <ScalarIcon
              class="relative z-10 w-2 shrink-0"
              icon="Play"
              size="xs" />
            <span class="text-xxs relative z-10 lg:flex hidden">Send</span>
          </ScalarButton>
        </div>
      </Listbox>
    </div>
  </div>
</template>
<style scoped>
:deep(.cm-editor) {
  background-color: var(--scalar-background-1);
  height: 100%;
  outline: none;
  width: 100%;
}
:deep(.cm-content) {
  padding: 2px 0;
}
.scroll-timeline-x {
  scroll-timeline: --scroll-timeline x;
  /* Firefox supports */
  scroll-timeline: --scroll-timeline horizontal;
  -ms-overflow-style: none; /* IE and Edge */
}
.scroll-timeline-x-address {
  line-height: 27px;
  scrollbar-width: none; /* Firefox */
}
/* make clickable are to left of send button */
.scroll-timeline-x-address:after {
  content: '';
  position: absolute;
  height: 100%;
  width: 24px;
  right: 0;
  cursor: text;
}
.scroll-timeline-x-address:empty:before {
  content: 'Enter URL or cURL request';
  color: var(--scalar-color-3);
  pointer-events: none;
}
.fade-left,
.fade-right {
  content: '';
  position: sticky;
  height: 100%;
  animation-name: fadein;
  animation-duration: 1ms;
  animation-direction: reverse;
  animation-timeline: --scroll-timeline;
  z-index: 1;
  pointer-events: none;
}
.fade-left {
  background: linear-gradient(
    -90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 30%,
    var(--scalar-background-1) 100%
  );
  left: 0;
  min-width: 3px;
  animation-direction: normal;
}
.fade-right {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 30%,
    var(--scalar-background-1) 100%
  );
  right: 0;
  min-width: 24px;
}
@keyframes fadein {
  0% {
    opacity: 0;
  }
  1% {
    opacity: 1;
  }
}
</style>
