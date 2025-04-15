<script setup lang="ts">
// import { ScalarIcon } from '@scalar/components'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { ref } from 'vue'

const isOpen = ref(true)
</script>

<template>
  <!-- Floating Button -->
  <template v-if="!isOpen">
    <div class="z-1 fixed bottom-6 right-6 z-10">
      <ScalarButton
        class="relative max-h-8 gap-1.5 p-2 text-xs"
        type="button"
        @click="isOpen = !isOpen">
        <ScalarIcon
          class="text-c-3"
          icon="Brackets"
          size="md" />
        Developer Tools
      </ScalarButton>
    </div>
  </template>

  <!-- Bottom Drawer -->
  <template v-if="isOpen">
    <div class="bg-b-2 z-1 right- 0 fixed bottom-0 left-0 z-10 w-full p-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <!-- Tabs (left) -->
        <h2 class="text-lg font-bold">Configuration</h2>
        <!-- Actions (right) -->

        <ScalarButton
          type="button"
          variant="ghost"
          @click="isOpen = false">
          <ScalarIcon
            class="text-c-3"
            icon="Close"
            size="md" />
        </ScalarButton>
      </div>
    </div>
  </template>
</template>
