<script setup lang="ts">
import {
  ScalarHeader,
  ScalarMenu,
  ScalarMenuLink,
  ScalarMenuProducts,
  ScalarMenuResources,
  ScalarMenuSection,
} from '@scalar/components'
import { ScalarIconGear } from '@scalar/icons'

const emit = defineEmits<{
  /** Emitted when the user wants to open the workspace settings */
  (e: 'navigate:to:settings'): void
}>()

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
        <template #products>
          <ScalarMenuProducts selected="client" />
        </template>
        <template #sections="{ close }">
          <ScalarMenuSection>
            <slot name="menuItems" />
            <ScalarMenuLink
              is="button"
              :icon="ScalarIconGear"
              @click="
                () => {
                  close()
                  emit('navigate:to:settings')
                }
              ">
              Settings
            </ScalarMenuLink>
          </ScalarMenuSection>
          <ScalarMenuResources />
        </template>
      </ScalarMenu>
    </template>
    <template
      v-if="slots.end"
      #end>
      <slots.end />
    </template>
  </ScalarHeader>
</template>
