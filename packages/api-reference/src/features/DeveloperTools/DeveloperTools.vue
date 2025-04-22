<script setup lang="ts">
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { isLocalUrl } from '@scalar/oas-utils/helpers'
import { useLocalStorage } from '@vueuse/core'

import FloatingButton from '@/features/DeveloperTools/components/FloatingButton.vue'

const isOpen = useLocalStorage('devtools.is-open', false)

/** Tabs configuration for the developer tools panel */
const tabs = [
  { id: 'console', label: 'Console', icon: 'Terminal' },
  { id: 'configuration', label: 'Configuration', icon: 'Settings' },
] as const

/** Show developer tools locally */
const shouldShow =
  import.meta.env.DEV ||
  (typeof window !== 'undefined' && isLocalUrl(window.location.href))
</script>

<template>
  <template v-if="shouldShow">
    <FloatingButton v-model="isOpen" />

    <!-- Developer Tools Drawer -->
    <template v-if="false">
      <div
        class="z-1 bg-b-2 fixed bottom-0 left-0 right-0 flex flex-col border-t">
        <!-- Header with Tabs and Controls -->
        <div class="flex items-center justify-between">
          <TabGroup
            as="div"
            class="flex flex-1 flex-col">
            <div
              class="border-c-4 flex items-center justify-between border-b px-2">
              <!-- Tabs -->
              <TabList class="flex h-full gap-1">
                <Tab
                  v-for="tab in tabs"
                  :key="tab.id"
                  v-slot="{ selected }"
                  as="template">
                  <ScalarButton
                    class="text-c-1 hover:bg-b-3 gap-1.5 rounded-none border-b-2 p-2 py-2 text-xs"
                    :class="{
                      'border-c-2': selected,
                    }"
                    size="sm"
                    variant="ghost">
                    <ScalarIcon
                      class="text-c-3"
                      :icon="tab.icon"
                      size="md" />
                    {{ tab.label }}
                  </ScalarButton>
                </Tab>
              </TabList>

              <!-- Controls -->
              <div class="flex items-center gap-2">
                <!-- Publish on Scalar -->
                <ScalarButton
                  class="h-6 gap-1.5 px-3"
                  type="button">
                  <ScalarIcon
                    class="text-c-2"
                    icon="Globe"
                    size="md" />
                  Publish on Scalar
                </ScalarButton>
                <!-- Close Button -->
                <ScalarButton
                  class="h-8 w-8 !p-0"
                  type="button"
                  variant="ghost"
                  @click="isOpen = false">
                  <ScalarIcon
                    class="text-c-2"
                    icon="Close"
                    size="md" />
                </ScalarButton>
              </div>
            </div>

            <!-- Main Content Area -->
            <TabPanels class="flex-1 overflow-auto">
              <TabPanel
                v-for="tab in tabs"
                :key="tab.id">
                <div class="h-80 overflow-auto">
                  <div class="h-full p-4 text-center">
                    {{ tab.label }}
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </div>
      </div>
    </template>
  </template>
</template>
