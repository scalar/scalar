<script setup lang="ts">
import { formatMs } from '@/libs/formatters'
import { useWorkspace } from '@/store/workspace'
import { ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import { httpStatusCodes } from '@scalar/oas-utils/helpers'
import { useRouter } from 'vue-router'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import { getStatusCodeColor } from './httpStatusCodeColors'

defineProps<{
  open: boolean
}>()

const { activeRequest, requestExampleMutators } = useWorkspace()

const router = useRouter()

function getPrettyResponseUrl(rawUrl: string) {
  const url = new URL(rawUrl)
  const params = new URLSearchParams(url.search)

  const scalarUrl = params.get('scalar_url')
  if (!scalarUrl) return url.href

  const scalarUrlParsed = new URL(scalarUrl)

  return scalarUrlParsed.href
}

function handleHistoryClick(index: number) {
  const historicalRequest = activeRequest.value.history[index]

  // see if we need to update the topnav
  // todo potentially search and find a previous open request id of this maybe
  // or we can open it in a draft state if the request is already open :)
  if (activeRequest.value.uid !== historicalRequest.request.requestUid) {
    router.push(`/request/${historicalRequest.request.requestUid}`)
  }
  requestExampleMutators.set(historicalRequest.request)
}
</script>
<template>
  <!-- History -->
  <ListboxButton
    v-if="activeRequest.history.length"
    class="hover:bg-b-2 mr-1 rounded p-1.5">
    <ScalarIcon
      class="text-c-3"
      icon="History"
      size="sm"
      thickness="2.25" />
  </ListboxButton>

  <!-- History shadow and placement-->
  <div
    :class="[
      'absolute left-0 top-[33px] w-full rounded before:pointer-events-none before:absolute before:left-0 before:top-[-33px] before:h-[calc(100%+33px)] before:w-full before:rounded z-50',
      { 'before:shadow-lg': open },
    ]">
    <!-- History Item -->
    <ListboxOptions
      class="bg-b-1 custom-scroll bg-mix-transparent bg-mix-amount-30 max-h-[300px] rounded-b p-[3px] pt-0 backdrop-blur">
      <ListboxOption
        v-for="({ response }, index) in activeRequest.history"
        :key="index"
        class="ui-active:bg-b-2 text-c-1 ui-active:text-c-1 flex cursor-pointer flex-row gap-2.5 rounded py-1.5 pr-3"
        :value="index"
        @click="handleHistoryClick(index)">
        <div class="font-code flex flex-1 gap-1.5 text-sm font-medium">
          <HttpMethod
            v-if="response.config.method"
            class="text-[11px] min-w-[44px]"
            :method="response.config.method" />
          <span class="text-c-2 gap-0">
            {{ getPrettyResponseUrl(response.config.url) }}
          </span>
        </div>
        <div
          class="font-code text-c-3 flex flex-row items-center gap-1.5 text-sm font-medium">
          <span>{{ formatMs(response.duration) }}</span>
          <span :class="[getStatusCodeColor(response.status).color]">
            {{ response.status }}
          </span>
          <span>
            {{ httpStatusCodes[response.status]?.name }}
          </span>
        </div>
      </ListboxOption>
    </ListboxOptions>
  </div>
</template>
