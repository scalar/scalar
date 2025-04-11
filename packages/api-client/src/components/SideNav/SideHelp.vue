<script setup lang="ts">
import {
  ScalarDropdown,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'

import SideNavLink from './SideNavLink.vue'
</script>
<template>
  <ScalarDropdown
    class="max-w-[150px]"
    :placement="'top-end'">
    <SideNavLink
      is="button"
      icon="Help"
      type="button">
      About
    </SideNavLink>

    <!-- Help Menu -->
    <template #items>
      <span class="text-c-2 px-2.5 py-1.5 text-xs font-medium">Support</span>
      <a
        class="block no-underline"
        href="https://discord.gg/scalar"
        target="_blank">
        <ScalarDropdownItem class="flex w-full items-center gap-1.5">
          <div class="flex items-center justify-center">
            <ScalarIcon
              icon="Discord"
              size="xs"
              thickness="1.75" />
          </div>
          <span>Discord</span>
        </ScalarDropdownItem>
      </a>
      <a
        class="block no-underline"
        href="https://github.com/scalar/scalar"
        target="_blank">
        <ScalarDropdownItem class="flex w-full items-center gap-1.5">
          <div class="flex items-center justify-center">
            <ScalarIcon
              icon="GitHubLine"
              size="xs"
              thickness="1.75" />
          </div>
          <span>GitHub</span>
        </ScalarDropdownItem>
      </a>
      <a
        class="block no-underline"
        href="mailto:support@scalar.com"
        target="_blank">
        <ScalarDropdownItem class="flex w-full items-center gap-1.5">
          <div class="flex items-center justify-center">
            <ScalarIcon
              icon="Email"
              size="xs" />
          </div>
          <span>Email</span>
        </ScalarDropdownItem>
      </a>
      <span class="text-c-2 px-2.5 py-1.5 text-xs font-medium">Product</span>
      <a
        class="block no-underline"
        href="https://scalar.com/changelog"
        target="_blank">
        <ScalarDropdownItem class="flex w-full items-center gap-1.5">
          <div class="flex items-center justify-center">
            <ScalarIcon
              icon="Changelog"
              size="xs"
              thickness="1.75" />
          </div>
          <span>Changelog</span>
        </ScalarDropdownItem>
      </a>
      <a
        class="block no-underline"
        href="https://github.com/scalar/scalar/issues/2669"
        target="_blank">
        <ScalarDropdownItem class="flex w-full items-center gap-1.5">
          <div class="flex items-center justify-center">
            <ScalarIcon
              icon="Roadmap"
              size="xs"
              thickness="1.75" />
          </div>
          <span>Roadmap</span>
        </ScalarDropdownItem>
      </a>
    </template>
  </ScalarDropdown>
</template>
