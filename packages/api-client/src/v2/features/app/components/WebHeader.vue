<script setup lang="ts">
import {
  ScalarHeader,
  ScalarHeaderButton,
  ScalarMenu,
  ScalarMenuProducts,
} from '@scalar/components'

import { SidebarToggle } from '@/v2/components/sidebar'

const isSidebarOpen = defineModel<boolean>('isSidebarOpen', {
  required: true,
})
</script>
<template>
  <ScalarHeader class="z-30">
    <template #start>
      <SidebarToggle
        v-model="isSidebarOpen"
        class="md:hidden" />
      <ScalarMenu>
        <template #products>
          <ScalarMenuProducts selected="client" />
        </template>
      </ScalarMenu>
    </template>
    <template #end>
      <ScalarHeaderButton
        is="a"
        href="https://dashboard.scalar.com/login"
        rel="noreferrer"
        target="_blank">
        Log in
      </ScalarHeaderButton>
      <ScalarHeaderButton
        active
        is="a"
        href="https://dashboard.scalar.com/register"
        rel="noreferrer"
        target="_blank">
        Register
      </ScalarHeaderButton>
    </template>
  </ScalarHeader>
</template>
