<script setup lang="ts">
import { themeClasses } from '@/constants'
import { executeRequestBus, syncPathParamsFromURL } from '@/libs'
import { useWorkspace } from '@/store/workspace'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import {
  REQUEST_METHODS,
  type RequestMethod,
  httpStatusCodes,
} from '@scalar/oas-utils/helpers'
import { isMacOS } from '@scalar/use-tooltip'
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import { getStatusCodeColor } from './httpStatusCodeColors'

const {
  activeRequest,
  activeExample,
  activeCollection,
  collectionMutators,
  servers,
  requestMutators,
} = useWorkspace()

const history = computed(() => activeRequest.value?.history ?? [])
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
/** Ensure we update the instance path parameters on change as well */
const onUrlChange = (newPath: string) => {
  if (!activeRequest.value) return

  // updateRequestInstance(
  //   activeRequest.value.uid,
  //   activeInstanceIdx,
  //   'url',
  //   newPath,
  // )
}

const percentage = ref(100)

executeRequestBus.on(() => {
  const interval = setInterval(() => {
    percentage.value -= 5
    if (percentage.value <= 0) {
      clearInterval(interval)
      percentage.value = 100
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

/**
 * Get a part of the URL object from the scalar proxy request
 *
 * @param request
 * @param the part of the url you want ex: origin or pathname etc
 */
function getUrlPart(request: XMLHttpRequest, part: keyof URL) {
  const url = new URL(request.responseURL)
  const params = new URLSearchParams(url.search)

  const scalarUrl = params.get('scalar_url')
  if (!scalarUrl) return url.origin

  const scalarUrlParsed = new URL(scalarUrl)
  const baseUrl = scalarUrlParsed[part]

  return baseUrl
}

const serverOptions = computed(() =>
  activeCollection.value?.spec.serverUids?.map((serverUid) => ({
    id: serverUid,
    label: servers[serverUid].url,
  })),
)

/** Update the currently selected server on the collection */
const updateSelectedServer = (serverUid: string) => {
  if (!activeCollection.value) return

  collectionMutators.edit(
    activeCollection.value.uid,
    'selectedServerUid',
    serverUid,
  )
}

/** Set server checkbox in the dropdown */
const isSelectedServer = (serverId: string) => {
  return activeCollection.value?.selectedServerUid === serverId
}

/**
 * TODO: This component is pretty much mocked for now, will come back and finish it up once we
 * Start making requests and adding some history
 */
</script>
<template>
  <div
    v-if="activeRequest && activeExample"
    class="flex flex-row items-center"
    :class="[themeClasses.topContainer]">
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
            'text-xxs bg-b-1 relative flex w-full lg:min-w-[720px] order-last lg:order-none flex-1 flex-row items-stretch rounded border p-[3px]',
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
              class="font-bold"
              isEditable
              isSquare
              :method="activeRequest.method"
              @change="updateRequestMethod" />
            <ScalarDropdown
              v-if="serverOptions"
              class="h-auto font-code text-sm whitespace-nowrap"
              :options="serverOptions"
              :value="activeCollection?.selectedServerUid">
              <ScalarButton
                class="relative h-auto min-h-[24.5px] shrink-0 gap-1.5 overflow-hidden px-1 py-0 font-code"
                size="sm"
                variant="outlined"
                @click.stop>
                {{ servers[activeCollection?.selectedServerUid ?? '']?.url }}
              </ScalarButton>
              <template #items>
                <ScalarDropdownItem
                  v-for="server in serverOptions"
                  :key="server.id"
                  class="flex group font-code text-sm whitespace-nowrap text-ellipsis overflow-hidden"
                  :value="server.id"
                  @click="updateSelectedServer(server.id)">
                  <div
                    class="flex size-4 items-center justify-center rounded-full p-[3px] group-hover:shadow-border"
                    :class="
                      isSelectedServer(server.id)
                        ? 'bg-blue text-b-1'
                        : 'text-transparent'
                    ">
                    <ScalarIcon
                      class="relative top-[0.5px] size-2.5 stroke-[1.75]"
                      icon="Checkmark" />
                  </div>
                  <span class="whitespace-nowrap text-ellipsis overflow-hidden">
                    {{ server.label }}
                  </span>
                </ScalarDropdownItem>
                <ScalarDropdownDivider />
                <ScalarDropdownItem>
                  <RouterLink
                    class="flex items-center gap-3"
                    to="/servers">
                    <div class="flex items-center justify-center h-4 w-4">
                      <ScalarIcon
                        class="h-2.5"
                        icon="Add" />
                    </div>
                    <span>Add Server</span>
                  </RouterLink>
                </ScalarDropdownItem>
              </template>
            </ScalarDropdown>
          </div>
          <div class="scroll-timeline-x relative flex w-full overflow-hidden">
            <div class="fade-left"></div>

            <!-- TODO wrap vars in spans for special effects like mouseOver descriptions -->
            <div class="flex w-full">
              <div
                class="scroll-timeline-x-address font-code text-c-1 flex flex-1 items-center whitespace-nowrap text-sm font-medium leading-[24.5px]"
                contenteditable
                @input="
                  (ev) => onUrlChange((ev.target as HTMLElement).innerText)
                "
                @keydown.enter.prevent="executeRequestBus.emit()">
                {{ activeRequest.path }}
              </div>
            </div>
            <div class="fade-right"></div>
          </div>

          <!-- History -->
          <ListboxButton
            v-if="activeRequest.history.length"
            class="hover:bg-b-2 mr-1 rounded p-1.5">
            <ScalarIcon
              class="text-c-3"
              icon="History"
              size="xs" />
          </ListboxButton>

          <!-- History shadow and placement-->
          <div
            :class="[
              'absolute left-0 top-[31px] w-full rounded before:pointer-events-none before:absolute before:left-0 before:top-[-31.5px] before:h-[calc(100%+31.5px)] before:w-full before:rounded z-50',
              { 'before:shadow-lg': open },
            ]">
            <!-- History Item -->
            <ListboxOptions
              class="bg-b-1 custom-scroll bg-mix-transparent bg-mix-amount-30 max-h-[300px] rounded-b p-[3px] pt-0 backdrop-blur">
              <ListboxOption
                v-for="({ response }, index) in history"
                :key="index"
                class="ui-active:bg-b-2 text-c-1 ui-active:text-c-1 flex cursor-pointer flex-row gap-2.5 rounded px-2.5 py-1.5 pr-3"
                :value="index">
                <div class="font-code flex flex-1 gap-1.5 text-sm font-medium">
                  <span
                    class="mr-[1px] min-w-[44px] pr-2 text-right"
                    :class="[getStatusCodeColor(response.status).color]">
                    {{ response.status }}
                  </span>
                  <span class="text-c-2 gap-0">
                    {{ getUrlPart(response.request, 'origin') }}
                    <em class="text-c-1 ml-[-8px]">{{
                      getUrlPart(response.request, 'pathname')
                    }}</em>
                  </span>
                </div>

                <!-- Response info -->
                <div
                  class="font-code text-c-3 flex flex-row items-center gap-3 text-sm font-medium">
                  <!-- <span>{{ formatMs(response.ms) }}</span> -->
                  <!-- <span>{{ formatBytes(response.bytes) }}</span> -->
                  <span>
                    {{ httpStatusCodes[response.status]?.name }}
                  </span>
                  <HttpMethod
                    class="text-sm"
                    :method="activeRequest.method" />
                </div>
              </ListboxOption>
            </ListboxOptions>
          </div>
          <ScalarButton
            class="relative h-auto shrink-0 gap-1.5 overflow-hidden px-2.5 py-1"
            @click="executeRequestBus.emit()">
            <ScalarIcon
              class="relative z-10 w-2 shrink-0"
              icon="Play"
              size="xs" />
            <span class="text-xxs relative z-10">Send</span>
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
  scrollbar-width: none; /* Firefox */
  overflow: auto;
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
</style>
