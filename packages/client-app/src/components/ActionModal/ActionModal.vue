<script setup lang="ts">
import ActionModalCollection from '@/components/ActionModal/ActionModalCollection.vue'
import ActionModalFolder from '@/components/ActionModal/ActionModalFolder.vue'
import ActionModalImport from '@/components/ActionModal/ActionModalImport.vue'
import ActionModalRequest from '@/components/ActionModal/ActionModalRequest.vue'
import ActionModalVariant from '@/components/ActionModal/ActionModalVariant.vue'
import { type ActionModalState, ActionModalTab } from '@/hooks'
import {
  Dialog,
  DialogDescription,
  DialogPanel,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@headlessui/vue'
import { computed, ref, watch } from 'vue'

const { state } = defineProps<{
  state: ActionModalState
}>()

const emits = defineEmits<{
  (event: 'update:tab', tab: string): void
}>()

const tabs = Object.keys(ActionModalTab)

const selectedTabIndex = computed(() => {
  const index = tabs.indexOf(state.tab)
  return index !== -1 ? index : tabs.indexOf('Request')
})
const selectedTab = ref(selectedTabIndex.value)

watch(
  selectedTabIndex,
  (newIndex) => {
    selectedTab.value = newIndex
  },
  { immediate: true },
)

const changeTab = (index: number) => {
  selectedTab.value = index
  emits('update:tab', tabs[index])
}
</script>
<template>
  <Dialog
    :open="state.open"
    @close="state.hide()">
    <div
      class="animate-modal-fade bg-backdrop fixed left-0 top-0 z-[1001] h-screen w-screen p-[20px] opacity-0">
      <DialogPanel
        class="animate-modal-pop before:bg-b-1 relative mx-auto mt-20 w-full max-w-[480px] scale-[0.98] rounded-lg opacity-0 before:absolute before:z-0 before:block before:h-full before:w-full before:rounded-lg before:content-['']">
        <DialogDescription
          class="bg-b-1 custom-scroll relative overflow-visible rounded-lg">
          <TabGroup
            :selectedIndex="selectedTab"
            @change="changeTab">
            <TabList class="flex justify-center border-b py-3">
              <Tab
                v-for="(tab, index) in tabs"
                :key="tab"
                class="text-c-2 relative px-[9px] text-sm font-medium"
                :class="
                  index === selectedTab
                    ? `!text-c-1 before:bg-c-1 before:absolute before:-bottom-[13px] before:left-0 before:h-px before:w-full before:content-['']`
                    : ''
                ">
                {{ tab }}
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel
                v-for="tab in tabs"
                :key="tab"
                class="flex flex-col items-center justify-center gap-3 p-2.5 pt-3 text-sm">
                <ActionModalRequest
                  v-if="tab === 'Request'"
                  :title="ActionModalTab.Request"
                  @close="state.hide()" />
                <ActionModalFolder
                  v-if="tab === 'Folder'"
                  :title="ActionModalTab.Folder"
                  @close="state.hide()" />
                <ActionModalImport
                  v-if="tab === 'Import'"
                  :title="ActionModalTab.Import"
                  @close="state.hide()" />
                <ActionModalCollection
                  v-if="tab === 'Collection'"
                  :title="ActionModalTab.Collection"
                  @close="state.hide()" />
                <ActionModalVariant
                  v-if="tab === 'Variant'"
                  :title="ActionModalTab.Variant"
                  @close="state.hide()" />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </DialogDescription>
      </DialogPanel>
    </div>
  </Dialog>
</template>
<style scoped>
.animate-modal-fade {
  animation: modal-fade 0.2s forwards;
}
.animate-modal-pop {
  animation: modal-pop 0.15s 0.15s forwards;
}
@keyframes modal-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes modal-pop {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
