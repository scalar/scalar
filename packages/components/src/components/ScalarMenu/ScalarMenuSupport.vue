<script setup lang="ts">
import { ScalarIconDiscordLogo, ScalarIconGithubLogo } from '@scalar/icons'

import ScalarMenuLink from './ScalarMenuLink.vue'
import ScalarMenuSection from './ScalarMenuSection.vue'
</script>
<template>
  <ScalarMenuSection>
    <template #title>Resources</template>
    <ScalarMenuLink
      href="https://discord.gg/scalar"
      :icon="ScalarIconDiscordLogo"
      target="_blank">
      Discord
    </ScalarMenuLink>
    <ScalarMenuLink
      href="https://github.com/scalar/scalar"
      :icon="ScalarIconGithubLogo"
      target="_blank">
      GitHub
    </ScalarMenuLink>
  </ScalarMenuSection>
</template>
