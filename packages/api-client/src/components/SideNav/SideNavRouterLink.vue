<script setup lang="ts">
import SideNavLink from '@/components/SideNav/SideNavLink.vue'
import type { ROUTES } from '@/constants'
import { PathId } from '@/routes'
import { useActiveEntities } from '@/store/active-entities'
import type { Icon } from '@scalar/components'
import { RouterLink } from 'vue-router'

defineProps<{
  icon: Icon
  name: (typeof ROUTES)[number]['name']
  active?: boolean
}>()

const { activeWorkspace } = useActiveEntities()
</script>
<template>
  <SideNavLink
    :is="RouterLink"
    :active="active"
    :icon="icon"
    :to="{
      name: `${name}.default`,
      params: {
        [PathId.Workspace]: activeWorkspace?.uid,
      },
    }">
    <slot />
  </SideNavLink>
</template>
