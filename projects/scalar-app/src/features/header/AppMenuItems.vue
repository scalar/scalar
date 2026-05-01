<script setup lang="ts">
import { ScalarMenuLink } from '@scalar/components'
import {
  ScalarIconGear,
  ScalarIconSignIn,
  ScalarIconSignOut,
} from '@scalar/icons'

import { useAuth } from '@/hooks/use-auth'

const emit = defineEmits<{
  (e: 'openSettings'): void
  (e: 'login'): void
}>()

const { isLoggedIn, logout } = useAuth()
</script>

<template>
  <ScalarMenuLink
    is="button"
    :icon="ScalarIconGear"
    @click="emit('openSettings')">
    Settings
  </ScalarMenuLink>
  <ScalarMenuLink
    is="button"
    v-if="!isLoggedIn"
    :icon="ScalarIconSignIn"
    @click="emit('login')">
    Log in
  </ScalarMenuLink>
  <ScalarMenuLink
    is="button"
    v-else
    :icon="ScalarIconSignOut"
    @click="logout">
    Log out
  </ScalarMenuLink>
</template>
