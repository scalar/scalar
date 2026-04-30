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

defineProps<{
  /**
   * Inline label rendered inside the menu trigger between the logo and the
   * caret. Used to surface the active scope ("Team" / "Local") so the menu
   * trigger doubles as the leading breadcrumb segment. Pass a plain string
   * so consumers do not have to pierce through a slot pipeline just to
   * tell the header which workspace type is active.
   */
  menuTitle?: string
}>()

const emit = defineEmits<{
  /** Emitted when the user wants to open the workspace settings */
  (e: 'navigate:to:settings'): void
}>()

const slots = defineSlots<{
  /**
   * Replaces the Scalar logo rendered inside the menu button. Typically used
   * by team-aware consumers to surface a team avatar or workspace logo so the
   * header reads as "this team / this workspace" at a glance.
   */
  logo?(): unknown
  /** Slot for customizing the menu items */
  menuItems?(): unknown
  /**
   * Slot rendered directly after the menu button in the start section of
   * the header. Typically used for a document breadcrumb / version-picker
   * combination that sits alongside the menu rather than floating in the
   * middle of the header.
   */
  breadcrumb?(): unknown
  /** Slot for customizing the end of the header */
  end?(): unknown
}>()
</script>

<template>
  <ScalarHeader class="w-full pl-3 *:first:flex-none">
    <template #start>
      <ScalarMenu>
        <template
          v-if="slots.logo"
          #logo>
          <slot name="logo" />
        </template>
        <template
          v-if="menuTitle"
          #title>
          {{ menuTitle }}
        </template>
        <template #products>
          <ScalarMenuProducts selected="client" />
        </template>
        <template #sections="{ close }">
          <ScalarMenuSection>
            <slot name="menuItems">
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
            </slot>
          </ScalarMenuSection>
          <ScalarMenuResources />
        </template>
      </ScalarMenu>
      <slot
        v-if="slots.breadcrumb"
        name="breadcrumb" />
    </template>
    <template
      v-if="slots.end"
      #end>
      <slot name="end" />
    </template>
  </ScalarHeader>
</template>
