<script setup lang="ts">
import {
  ScalarHeader,
  ScalarMenu,
  ScalarMenuResources,
  ScalarMenuSection,
} from '@scalar/components'

const slots = defineSlots<{
  /** Slot for customizing the menu items */
  menuItems?(): unknown
  /** Slot for customizing the end of the header */
  end?(): unknown
}>()
</script>

<template>
  <ScalarHeader class="w-full pl-3 *:first:flex-none">
    <template #start>
      <ScalarMenu>
        <template #sections>
          <ScalarMenuSection>
            <slot name="menuItems" />
          </ScalarMenuSection>
          <ScalarMenuResources />
        </template>
      </ScalarMenu>
    </template>
    <template #end>
      <slots.end />
    </template>
  </ScalarHeader>
</template>
