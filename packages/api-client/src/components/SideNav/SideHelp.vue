<script setup lang="ts">
import { ScalarDropdown, ScalarDropdownItem } from '@scalar/components'
import {
  ScalarIconDiscordLogo,
  ScalarIconEnvelope,
  ScalarIconGithubLogo,
  ScalarIconMapTrifold,
  ScalarIconNote,
  ScalarIconQuestion,
} from '@scalar/icons'

import SideNavLink from './SideNavLink.vue'
</script>
<template>
  <ScalarDropdown
    class="max-w-[150px]"
    :placement="'top-end'">
    <SideNavLink
      is="button"
      :icon="ScalarIconQuestion"
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
            <ScalarIconDiscordLogo
              class="size-3"
              weight="light" />
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
            <ScalarIconGithubLogo
              class="size-3"
              weight="light" />
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
            <ScalarIconEnvelope class="size-3" />
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
            <ScalarIconNote
              class="size-3"
              weight="light" />
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
            <ScalarIconMapTrifold
              class="size-3"
              weight="light" />
          </div>
          <span>Roadmap</span>
        </ScalarDropdownItem>
      </a>
    </template>
  </ScalarDropdown>
</template>
