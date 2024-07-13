<script lang="ts" setup>
import ScalarHotkey from '@/components/ScalarHotkey.vue'
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
</script>
<template>
  <ScalarDropdown teleport="#scalar-client">
    <ScalarButton
      class="z-10 hover:bg-b-3 transition-none p-1 group-hover:flex ui-open:flex absolute left-0 hidden -translate-x-full -ml-1"
      size="sm"
      variant="ghost"
      @click.stop>
      <ScalarIcon
        icon="Ellipses"
        size="sm" />
    </ScalarButton>
    <template #items>
      <ScalarDropdownItem class="flex !gap-2">
        <ScalarIcon
          class="text-c-2 inline-flex p-px"
          icon="Edit"
          size="xs" />
        <span>Rename</span>
        <ScalarHotkey
          class="absolute right-2 text-c-3"
          hotkey="1" />
      </ScalarDropdownItem>
    </template>
  </ScalarDropdown>
</template>
