<script setup lang="ts">
import Variant from '@/assets/ascii/variant.ascii?raw'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { useWorkspace } from '@/store/workspace'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { ref } from 'vue'

defineProps<{
  title: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { workspaceRequests } = useWorkspace()
const variantName = ref('')
const selectedRequest = ref(workspaceRequests.value[0])

function handleSelect(request: any) {
  selectedRequest.value = request
}
</script>
<template>
  <ScalarAsciiArt :art="Variant" />
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="emits('close')">
    <input
      v-model="variantName"
      class="h-10 rounded border p-2"
      label="Variant Name"
      placeholder="Variant Name" />
    <div class="z-10">
      <span class="mb-1 block font-medium">Inside:</span>
      <ScalarDropdown
        placement="bottom"
        resize>
        <ScalarButton
          class="justify-between p-2 w-full"
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
              v-for="request in workspaceRequests"
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
    <ScalarButton type="submit"> Create Variant </ScalarButton>
  </form>
</template>
