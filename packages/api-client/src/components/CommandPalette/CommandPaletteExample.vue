<script setup lang="ts">
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { onMounted, ref } from 'vue'

defineProps<{
  title: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { activeWorkspaceRequests } = useWorkspace()
const exampleName = ref('')
const selectedRequest = ref(activeWorkspaceRequests.value[0])

function handleSelect(request: any) {
  selectedRequest.value = request
}

const exampleInput = ref<HTMLInputElement | null>(null)
onMounted(() => {
  exampleInput.value?.focus()
})
</script>
<template>
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="emits('close')">
    <div
      class="gap-3 rounded bg-b-2 focus-within:bg-b-1 focus-within:shadow-border min-h-20 relative">
      <label
        class="absolute w-full h-full opacity-0 cursor-text"
        for="examplename"></label>
      <input
        id="examplename"
        ref="exampleInput"
        v-model="exampleName"
        class="border-transparent outline-none w-full pl-8 text-sm min-h-8 py-1.5"
        label="Variant Name"
        placeholder="Variant Name" />
    </div>
    <div class="flex gap-2">
      <div class="flex flex-1 max-h-8">
        <ScalarDropdown
          placement="bottom"
          resize>
          <ScalarButton
            class="justify-between p-2 max-h-8 w-full gap-1 text-xs hover:bg-b-2"
            variant="outlined"
            @click="handleSelect(selectedRequest)">
            {{ selectedRequest.summary }}
            <div class="flex items-center gap-2">
              <HttpMethod :method="selectedRequest.method" />
              <ScalarIcon
                class="text-c-3"
                icon="ChevronDown"
                size="xs" />
            </div>
          </ScalarButton>
          <template #items>
            <div class="max-h-40 custom-scroll">
              <ScalarDropdownItem
                v-for="request in activeWorkspaceRequests"
                :key="request.uid"
                class="flex h-7 w-full items-center justify-between px-1 pr-[26px]"
                @click="handleSelect(request)">
                {{ request.summary }}
                <HttpMethod :method="request.method" />
              </ScalarDropdownItem>
            </div>
          </template>
        </ScalarDropdown>
      </div>
      <ScalarButton
        class="max-h-8 text-xs p-0 px-3"
        type="submit">
        Create Example
      </ScalarButton>
    </div>
  </form>
</template>
