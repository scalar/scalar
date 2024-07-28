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
  <ScalarDropdown :placement="'top-end'">
    <ScalarButton
      class="font-normal h-full justify-start py-1.5 px-1.5 text-c-1 hover:bg-b-2 w-fit"
      fullWidth
      variant="ghost">
      <h2 class="font-medium m-0 text-sm flex gap-1.5 items-center">🚨</h2>
    </ScalarButton>

    <!-- Workspace list -->
    <template #items>
      <span>Support</span>
      <a
        href="https://discord.gg/scalar"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              class="h-2.5"
              icon="Discord" />
          </div>
          <span>Discord</span>
        </ScalarDropdownItem>
      </a>
      <a
        href="https://github.com/scalar/scalar"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              class="h-2.5"
              icon="GitHub" />
          </div>
          <span>Github</span>
        </ScalarDropdownItem>
      </a>
      <a
        href="mailto:marc@scalar.com"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              class="h-2.5"
              icon="ExternalLink" />
          </div>
          <span>Email</span>
        </ScalarDropdownItem>
      </a>
      <ScalarDropdownDivider />
      <span>Product</span>
      <a
        href="https://scalar.com/changelog"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              class="h-2.5"
              icon="ExternalLink" />
          </div>
          <span>Changelog</span>
        </ScalarDropdownItem>
      </a>
      <a
        href="https://scalar.com/changelog"
        target="_blank">
        <ScalarDropdownItem class="flex items-center gap-1.5">
          <div class="flex items-center justify-center h-4 w-4">
            <ScalarIcon
              class="h-2.5"
              icon="ExternalLink" />
          </div>
          <span>Roadmap</span>
        </ScalarDropdownItem>
      </a>
    </template>
  </ScalarDropdown>
</template>
