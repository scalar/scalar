<script setup lang="ts">
import Request from '@/assets/ascii/request.ascii?raw'
import { REQUEST_METHODS } from '@/components/HttpMethod/httpMethods'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import {
  type RequestRef,
  createRequestInstance,
} from '@scalar/oas-utils/entities/workspace/spec'
import { nanoid } from 'nanoid'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  title: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { push } = useRouter()

const { requestMutators, collectionMutators, activeCollection } = useWorkspace()
const requestName = ref('')
const requestMethod = ref('')

function handleChangeMethod(method: string) {
  requestMethod.value = method
}

function handleSubmit() {
  if (!activeCollection.value) return
  const newRequest: RequestRef = {
    uid: nanoid(),
    path: requestName.value,
    method: requestMethod.value,
    description: requestName.value,
    operationId: requestName.value,
    summary: requestName.value,
    values: [],
    ref: null,
    tags: ['default'],
    parameters: {
      path: {},
      query: {},
      headers: {},
      cookies: {},
    },
    history: [],
  }
  newRequest.values.push(createRequestInstance(newRequest))
  requestMutators.add(newRequest)
  collectionMutators.edit(
    0,
    'requests',
    activeCollection.value.requests.concat(newRequest.uid),
  )

  push(`/request/${newRequest.uid}`)

  emits('close')
}
</script>
<template>
  <ScalarAsciiArt :art="Request" />
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="handleSubmit">
    <input
      v-model="requestName"
      class="h-10 rounded border p-2"
      label="Request Name"
      placeholder="Request Name" />
    <div
      class="divide divide-b-3 flex flex-col divide-y overflow-hidden rounded border">
      <button
        v-for="method in Object.keys(REQUEST_METHODS)"
        :key="method"
        class="hover:bg-b-2 relative flex h-10 items-center justify-between p-2 after:block after:h-5 after:w-5 after:rounded-full after:border after:content-['']"
        :class="{
          'after:bg-b-btn': method === requestMethod,
        }"
        type="button"
        @click="handleChangeMethod(method)">
        <ScalarIcon
          v-if="method === requestMethod"
          class="text-b-1 absolute right-3"
          icon="Checkmark"
          size="xs" />
        <span class="text-xxs capitalize">
          {{ method }}
        </span>
      </button>
    </div>
    <ScalarButton type="submit"> Create </ScalarButton>
  </form>
</template>
