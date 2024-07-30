<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
</script>
<template>
  <ScalarDropdown
    class="max-w-[150px]"
    :placement="'top-end'">
    <ScalarButton
      class="min-w-[37px] max-w-[42px] hover:bg-b-2 flex items-center justify-center rounded-lg p-[7px]"
      fullWidth
      variant="ghost">
      <ScalarIcon
        icon="Help"
        thickness="1.5" />
    </ScalarButton>

    <!-- Workspace list -->
    <template #items>
      <span class="px-2.5 py-1.5 text-xs text-c-2 font-medium">Support</span>
      <a
        class="no-underline block"
        href="https://discord.gg/scalar"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5 w-full">
          <div class="flex items-center justify-center">
            <ScalarIcon
              class="h-2.5"
              icon="Discord" />
          </div>
          <span>Discord</span>
        </ScalarDropdownItem>
      </a>
      <a
        class="no-underline block"
        href="https://github.com/scalar/scalar"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5 w-full">
          <div class="flex items-center justify-center">
            <ScalarIcon
              class="h-2.5"
              icon="GitHub" />
          </div>
          <span>Github</span>
        </ScalarDropdownItem>
      </a>
      <a
        class="no-underline block"
        href="mailto:marc@scalar.com"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5 w-full">
          <div class="flex items-center justify-center">
            <ScalarIcon
              class="h-2.5"
              icon="Email" />
          </div>
          <span>Email</span>
        </ScalarDropdownItem>
      </a>
      <span class="px-2.5 py-1.5 text-xs text-c-2 font-medium">Product</span>
      <a
        class="no-underline block"
        href="https://scalar.com/changelog"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5 w-full">
          <div class="flex items-center justify-center">
            <ScalarIcon
              class="h-2.5"
              icon="Changelog"
              thickness="2" />
          </div>
          <span>Changelog</span>
        </ScalarDropdownItem>
      </a>
      <a
        class="no-underline block"
        href="https://github.com/scalar/scalar/issues/2669"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5 w-full">
          <div class="flex items-center justify-center">
            <ScalarIcon
              class="h-2.5"
              icon="Roadmap"
              thickness="2" />
          </div>
          <span>Roadmap</span>
        </ScalarDropdownItem>
      </a>
    </template>
  </ScalarDropdown>
</template>
