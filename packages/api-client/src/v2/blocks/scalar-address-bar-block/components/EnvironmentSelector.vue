<script setup lang="ts">
import {
  ScalarButton,
  ScalarDropdown,
  ScalarDropdownDivider,
  ScalarDropdownItem,
  ScalarIcon,
} from '@scalar/components'
import { computed } from 'vue'

const { environments = [], activeEnvironment } = defineProps<{
  /** List of available environments */
  environments?: string[]
  /** Currently selected environment */
  activeEnvironment?: string
}>()

const emit = defineEmits<{
  /** Emitted when an environment is selected */
  (e: 'select:environment', environmentName: string): void
  /** Emitted when user wants to add a new environment */
  (e: 'add:environment'): void
}>()

/** Whether an environment is currently active */
const hasActiveEnvironment = computed(() => !!activeEnvironment)

/** Whether environments exist */
const hasEnvironments = computed(() => environments.length > 0)

/** Whether the currently selected environment exists in the dropdown options */
const hasSelectedEnvironmentInOptions = computed(() => {
  if (!activeEnvironment) {
    return false
  }

  return environments.includes(activeEnvironment)
})

/** True when an environment is selected but unavailable in the current context */
const hasMissingActiveEnvironment = computed(
  () => hasActiveEnvironment.value && !hasSelectedEnvironmentInOptions.value,
)

/** Display text for the button */
const displayText = computed(() => {
  if (hasMissingActiveEnvironment.value) {
    return `${activeEnvironment} (Unavailable)`
  }

  if (hasActiveEnvironment.value) {
    return activeEnvironment
  }
  if (!hasEnvironments.value) {
    return 'Add Environment'
  }
  return 'Select Environment'
})

/** Button styling based on state */
const buttonClass = computed(() => {
  if (hasMissingActiveEnvironment.value) {
    return 'hover:bg-b-2 text-c-2 border-transparent'
  }

  if (hasActiveEnvironment.value) {
    return 'bg-c-accent/10 text-c-accent hover:bg-c-accent/20 border-c-accent/30'
  }
  if (!hasEnvironments.value) {
    return 'hover:bg-b-2 text-c-3 border-transparent'
  }
  return 'hover:bg-b-2 text-c-2 border-transparent'
})

const handleAddEnvironment = () => {
  emit('add:environment')
}

const handleSelectEnvironment = (environmentName: string) => {
  emit('select:environment', environmentName)
}
</script>

<template>
  <div class="relative flex items-center">
    <!-- Environment indicator badge (only show when active) -->

    <ScalarDropdown>
      <ScalarButton
        :aria-label="`Current environment: ${displayText}`"
        class="line-clamp-1 h-full w-fit justify-start border px-2 py-1 font-normal transition-colors"
        :class="buttonClass"
        size="sm"
        variant="ghost">
        <div class="flex max-w-[220px] min-w-0 items-center gap-1.5">
          <!-- Icon indicator -->
          <ScalarIcon
            class="shrink-0"
            :class="
              hasActiveEnvironment && !hasMissingActiveEnvironment
                ? 'text-c-accent'
                : 'text-c-3'
            "
            icon="Globe"
            size="sm" />

          <!-- Environment name -->
          <span
            class="text-xxs block max-w-[160px] min-w-0 truncate text-left font-medium">
            {{ displayText }}
          </span>

          <!-- Dropdown arrow -->
          <ScalarIcon
            class="shrink-0"
            icon="ChevronDown"
            size="xs" />
        </div>
      </ScalarButton>

      <template #items>
        <!-- No environment option (clear selection) -->
        <ScalarDropdownItem
          v-if="hasActiveEnvironment"
          class="group/item flex w-full items-center gap-1.5"
          @click="handleSelectEnvironment('')">
          <div
            class="flex h-4 w-4 items-center justify-center rounded-full p-[3px]"
            :class="
              !activeEnvironment
                ? 'bg-c-accent text-b-1'
                : 'shadow-border text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3" />
          </div>
          <span class="text-c-2">No Environment</span>
        </ScalarDropdownItem>

        <ScalarDropdownDivider v-if="hasActiveEnvironment && hasEnvironments" />

        <!-- Environment list -->
        <ScalarDropdownItem
          v-for="environmentName in environments"
          :key="environmentName"
          class="group/item flex w-full min-w-0 items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
          @click="handleSelectEnvironment(environmentName)">
          <div
            class="flex h-4 w-4 items-center justify-center rounded-full p-[3px]"
            :class="
              activeEnvironment === environmentName
                ? 'bg-c-accent text-b-1'
                : 'shadow-border text-transparent'
            ">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3" />
          </div>
          <span class="min-w-0 flex-1 truncate">{{ environmentName }}</span>
        </ScalarDropdownItem>
        <ScalarDropdownDivider v-if="hasMissingActiveEnvironment" />

        <ScalarDropdownItem
          v-if="hasMissingActiveEnvironment"
          class="group/item flex h-auto w-full min-w-0 items-start gap-1.5 overflow-hidden"
          disabled>
          <div
            class="bg-c-accent text-b-1 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full p-[3px]">
            <ScalarIcon
              class="size-2.5"
              icon="Checkmark"
              thickness="3" />
          </div>
          <div class="min-w-0 flex-1 text-left">
            <span class="block truncate">
              {{ activeEnvironment }}
            </span>
            <span class="text-c-3 block truncate text-xs">
              Not available in this context
            </span>
          </div>
        </ScalarDropdownItem>

        <ScalarDropdownDivider v-if="hasEnvironments" />

        <!-- Add new environment button -->
        <ScalarDropdownItem
          class="text-c-accent flex items-center gap-1.5"
          @click="handleAddEnvironment">
          <div class="flex h-4 w-4 items-center justify-center">
            <ScalarIcon
              icon="Add"
              size="sm" />
          </div>
          <span>{{
            hasEnvironments ? 'New Environment' : 'Create Environment'
          }}</span>
        </ScalarDropdownItem>

        <!-- Helper text for empty state -->
        <div
          v-if="!hasEnvironments && !hasActiveEnvironment"
          class="text-c-3 px-2 py-1.5 text-xs">
          <p class="mb-1">
            Environments let you manage variables like API keys and base URLs
            across different contexts.
          </p>
        </div>
      </template>
    </ScalarDropdown>
  </div>
</template>
