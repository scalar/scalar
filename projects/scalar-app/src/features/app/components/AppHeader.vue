<script setup lang="ts">
import {
  ScalarHeader,
  ScalarMenu,
  ScalarMenuLink,
  ScalarMenuProducts,
  ScalarMenuResources,
  ScalarMenuSection,
  ScalarMenuTeamPicker,
  type ScalarMenuTeamOption,
} from '@scalar/components'
import { ScalarIconGear } from '@scalar/icons'
import { computed } from 'vue'

import { useAuth } from '@/hooks/use-auth'
import { useTeams } from '@/hooks/use-teams'

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

const { currentTeam, teams: allTeams } = useTeams()
const { isLoggedIn, refreshTokens } = useAuth()

/** Convert teams to menu items */
const teams = computed<ScalarMenuTeamOption[]>(
  () =>
    allTeams.value?.map((t) => ({
      id: t.uid,
      label: t.name,
      src: t.imageUri,
    })) ?? [],
)

/** Select the current team option */
const team = computed<ScalarMenuTeamOption | undefined>(() => {
  return teams.value.find((t) => t.id === currentTeam.value?.uid)
})

/** Looks like we refresh our token with the teamUid to change teams */
const switchTeam = (t?: ScalarMenuTeamOption) => refreshTokens(t?.id)
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
          <span class="max-md:hidden">
            {{ menuTitle }}
          </span>
        </template>
        <template #products>
          <ScalarMenuProducts selected="client" />
        </template>
        <template #sections="{ close }">
          <ScalarMenuSection>
            <ScalarMenuTeamPicker
              v-if="isLoggedIn"
              :allowAddTeam="false"
              :team
              :teams
              @update:team="switchTeam" />
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
