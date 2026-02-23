<script lang="ts">
/** Document collection page — tabs for Overview, Servers, Auth, Environment, Cookies, and Settings. */
export default {}
</script>

<script setup lang="ts">
import { isHttpMethod } from '@scalar/helpers/http/is-http-method'
import { computed, ref, watch } from 'vue'
import { RouterView } from 'vue-router'

import type { RouteProps } from '@/v2/features/app/helpers/routes'
import LabelInput from '@/v2/features/collection/components/LabelInput.vue'

import Tabs from './components/Tabs.vue'

const props = defineProps<RouteProps>()

const operation = computed(() => {
  if (!props.path || !props.method) {
    return null
  }

  return props.document?.paths?.[props.path]?.[props.method]
})

/**
 * Local copy of the label so we can reset on empty-blur rejection and stay in
 * sync when Vue Router reuses this component across workspace navigations.
 */
const operationSummary = ref(operation.value?.summary ?? '')

watch(
  () => operation.value?.summary,
  (newSummary) => {
    operationSummary.value = newSummary ?? ''
  },
)

/** Emits the rename event on blur, or resets the input if the title is blank. */
const handleSummaryUpdate = (payload: string) => {
  const { path, method } = props

  if (!path || !method || !isHttpMethod(method)) {
    return
  }

  props.eventBus.emit('operation:update:meta', {
    meta: { path, method },
    payload: {
      summary: payload.trim(),
    },
  })
}

const operationPlaceholder = computed(() => {
  if (!props.path || !props.method) {
    return 'Untitled Operation'
  }
  return `${props.method.toUpperCase()} ${props.path}`
})
</script>

<template>
  <div class="custom-scroll h-full">
    <div class="w-full md:mx-auto md:max-w-180">
      <!-- Header -->
      <div
        :aria-label="`title: ${activeWorkspace.label}`"
        class="mx-auto flex h-fit w-full flex-row items-center gap-2 pt-8 pb-3 md:max-w-180">
        <div class="group relative ml-1.25">
          <LabelInput
            v-model="operationSummary"
            class="text-xl font-bold"
            inputId="operationSummary"
            :placeholder="operationPlaceholder"
            @blur="handleSummaryUpdate" />
        </div>
      </div>

      <!-- Tabs -->
      <Tabs type="operation" />

      <!-- Router views -->
      <div class="px-1.5 py-8">
        <RouterView
          v-bind="props"
          collectionType="operation" />
      </div>
    </div>
  </div>
</template>
