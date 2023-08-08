<script setup lang="ts">
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'
import prettyBytes from 'pretty-bytes'
import prettyMilliseconds from 'pretty-ms'

import { useApiClientRequestStore } from '../../stores/apiClientRequestStore'
import { type ClientResponse } from '../../types'

defineProps<{ history: string }>()
TimeAgo.addLocale(en)
const timeAgo = new TimeAgo('en-US')

const { requestHistory, activeRequestId, setActiveResponse } =
  useApiClientRequestStore()

const getContentLength = (response: ClientResponse) => {
  if (response?.headers?.['X-API-Client-Content-Length']) {
    return prettyBytes(
      parseFloat(response.headers['X-API-Client-Content-Length']),
    )
  }
  return prettyBytes(0)
}
</script>
<template>
  <div
    class="navtable-item"
    :class="{ 'navtable-item__active': activeRequestId === history }"
    @click="setActiveResponse(history)">
    <div class="navtable-item-40 navtable-item-request">
      <button
        class="radio"
        :class="requestHistory[history].request.type.toLowerCase()"
        type="button" />
      <span>
        <em>{{ requestHistory[history].request.type }}</em>
        {{ requestHistory[history].request.url }}
      </span>
    </div>
    <div class="navtable-item-40 navtable-item-response">
      <span>{{
        prettyMilliseconds(requestHistory[history].response.duration)
      }}</span>
      <span
        :class="`scalar-api-client__status--${String(
          requestHistory[history].response.statusCode,
        ).charAt(0)}xx`">
        {{ requestHistory[history].response.statusCode }}
      </span>
      <span>{{ getContentLength(requestHistory[history].response) }}</span>
    </div>
    <div class="navtable-item-20 navtable-item-time">
      <span>
        {{ timeAgo.format(requestHistory[history].sentTime) }}
      </span>
    </div>
  </div>
</template>
