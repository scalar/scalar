<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import { ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { ScalarIcon } from '@scalar/components'
import { httpStatusCodes } from '@scalar/oas-utils/helpers'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import { getStatusCodeColor } from './httpStatusCodeColors'

defineProps<{
  open: boolean
}>()

const { requestsHistory } = useWorkspace()

const history = requestsHistory

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
</script>
<template>
  <!-- History -->
  <ListboxButton
    v-if="history.length"
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
        class="ui-active:bg-b-2 text-c-1 ui-active:text-c-1 flex cursor-pointer flex-row gap-2.5 rounded py-1.5 pr-3"
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
            class="lg:text-sm text-xs"
            :method="response.config.method" />
        </div>
      </ListboxOption>
    </ListboxOptions>
  </div>
</template>
