<script setup lang="ts">
import {
  ScalarButton,
  ScalarIcon,
  ScalarModal,
  useModal,
  type ModalState,
} from '@scalar/components'
import type { Collection } from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'
import { computed, ref, watch } from 'vue'

import { CodeInput } from '@scalar/api-client/components/CodeInput'
import { useActiveEntities, useWorkspace } from '@scalar/api-client/store'

import EnvironmentModal from './EnvironmentModal.vue'

const props = defineProps<{
  state: ModalState
  activeWorkspaceCollections: Collection[]
}>()

const emit = defineEmits<{
  (event: 'cancel'): void
}>()

const { activeWorkspace, activeWorkspaceCollections, activeEnvVariables } = useActiveEntities()
const { collectionMutators, workspaceMutators } = useWorkspace()
const { toast } = useToasts()

// Modal states
const environmentModal = useModal()
const selectedEnvironment = ref<string | null>(null)
const selectedCollection = ref<string | null>(null)
const environmentValue = ref('{}')

// Get all environments from all collections
const allEnvironments = computed(() => {
  const environments: Array<{
    name: string
    collectionId: string
    collectionName: string
    color: string
    variables: Record<string, string>
  }> = []

  // Add global environment
  if (activeWorkspace.value?.environments) {
    const globalVars: Record<string, string> = {}
    Object.entries(activeWorkspace.value.environments).forEach(([key, value]) => {
      if (typeof value === 'string') {
        globalVars[key] = value
      } else if (typeof value === 'object' && value && 'default' in value) {
        globalVars[key] = (value as any).default || ''
      }
    })
  }

  // Add collection environments
  activeWorkspaceCollections.value.forEach((collection) => {
    if (collection['x-scalar-environments']) {
      Object.entries(collection['x-scalar-environments']).forEach(([name, env]) => {
        if (env) {
          const envVars: Record<string, string> = {}
          if (env.variables) {
            Object.entries(env.variables).forEach(([key, value]) => {
              if (typeof value === 'string') {
                envVars[key] = value
              } else if (typeof value === 'object' && value && 'default' in value) {
                envVars[key] = (value as any).default || ''
              }
            })
          }
          
          environments.push({
            name,
            collectionId: collection.uid,
            collectionName: collection.info?.title ?? 'Untitled Collection',
            color: env?.color || '#FFFFFF',
            variables: envVars,
          })
        }
      })
    }
  })

  return environments
})

// Current environment data
const currentEnvironment = computed(() => {
  if (!selectedEnvironment.value || !selectedCollection.value) {
    return null
  }

  const collection = activeWorkspaceCollections.value.find(
    (c) => c.uid === selectedCollection.value
  )
  if (collection?.['x-scalar-environments']?.[selectedEnvironment.value]) {
    const env = collection['x-scalar-environments'][selectedEnvironment.value]
    return {
      name: selectedEnvironment.value,
      collectionId: collection.uid,
      collectionName: collection.info?.title ?? 'Untitled Collection',
      color: env?.color || '#FFFFFF',
      variables: env?.variables || {},
    }
  }

  return null
})

// Update environment value when selection changes
watch(
  () => currentEnvironment.value,
  (env) => {
    if (env) {
      environmentValue.value = JSON.stringify(env.variables, null, 2)
    } else {
      environmentValue.value = '{}'
    }
  },
  { immediate: true }
)

// Handle environment variable updates
function handleEnvironmentUpdate(raw: string) {
  if (!currentEnvironment.value) {
    return
  }

  try {
    const updatedValue = JSON.parse(raw)
    
    if (currentEnvironment.value.collectionId === 'global') {
      // Update global environment
      workspaceMutators.edit(
        activeWorkspace.value?.uid,
        'environments',
        updatedValue,
      )
    } else {
      // Update collection environment
      const collection = activeWorkspaceCollections.value.find(
        (c) => c.uid === currentEnvironment.value?.collectionId
      )
      if (collection?.['x-scalar-environments']?.[currentEnvironment.value.name]) {
        const environments = {
          ...collection['x-scalar-environments'],
          [currentEnvironment.value.name]: {
            ...collection['x-scalar-environments'][currentEnvironment.value.name],
            variables: updatedValue,
          },
        }
        collectionMutators.edit(
          collection.uid,
          'x-scalar-environments',
          environments,
        )
      }
    }
  } catch (error) {
    toast('Invalid JSON format', 'error')
  }
}

// Handle environment creation
function handleEnvironmentSubmit(environment: {
  name: string
  color: string
  type: string
  collectionId: string | undefined
}) {
  if (environment.collectionId) {
    collectionMutators.addEnvironment(
      environment.name,
      {
        variables: {},
        color: environment.color,
      },
      environment.collectionId as any,
    )
    
    // Select the newly created environment
    selectedEnvironment.value = environment.name
    selectedCollection.value = environment.collectionId
    
    // Set the active environment ID in the workspace
    if (activeWorkspace.value) {
      workspaceMutators.edit(
        activeWorkspace.value.uid,
        'activeEnvironmentId',
        environment.name
      )
    }
    
    toast(`Environment "${environment.name}" created successfully!`, 'info')
  }
  environmentModal.hide()
}

// Handle environment selection
function selectEnvironment(environment: typeof allEnvironments.value[0]) {
  selectedEnvironment.value = environment.name
  selectedCollection.value = environment.collectionId
  
  // Set the active environment ID in the workspace
  if (activeWorkspace.value) {
    workspaceMutators.edit(
      activeWorkspace.value.uid,
      'activeEnvironmentId',
      environment.name
    )
  }
}

// Initialize selection when modal opens
watch(
  () => props.state.open,
  (isOpen) => {
    if (isOpen) {
      // Initialize with the currently active environment
      const activeEnvId = activeWorkspace.value?.activeEnvironmentId
      if (activeEnvId) {
        // Find the active environment in the collections
        const activeEnv = allEnvironments.value.find(env => env.name === activeEnvId)
        if (activeEnv) {
          selectedEnvironment.value = activeEnv.name
          selectedCollection.value = activeEnv.collectionId
          // The environment value will be set by the watch function
        } else {
          // No active environment found, auto-select if environments exist
          if (allEnvironments.value.length > 0) {
            const firstEnv = allEnvironments.value[0]
            if (firstEnv) {
              selectedEnvironment.value = firstEnv.name
              selectedCollection.value = firstEnv.collectionId
              // Set as active environment in workspace
              if (activeWorkspace.value) {
                workspaceMutators.edit(
                  activeWorkspace.value.uid,
                  'activeEnvironmentId',
                  firstEnv.name
                )
              }
            } else {
              selectedEnvironment.value = null
              selectedCollection.value = null
              environmentValue.value = '{}'
            }
          } else {
            selectedEnvironment.value = null
            selectedCollection.value = null
            environmentValue.value = '{}'
          }
        }
      } else {
        // No active environment, auto-select if environments exist
        if (allEnvironments.value.length > 0) {
          const firstEnv = allEnvironments.value[0]
          if (firstEnv) {
            selectedEnvironment.value = firstEnv.name
            selectedCollection.value = firstEnv.collectionId
            // Set as active environment in workspace
            if (activeWorkspace.value) {
              workspaceMutators.edit(
                activeWorkspace.value.uid,
                'activeEnvironmentId',
                firstEnv.name
              )
            }
          } else {
            selectedEnvironment.value = null
            selectedCollection.value = null
            environmentValue.value = '{}'
          }
        } else {
          selectedEnvironment.value = null
          selectedCollection.value = null
          environmentValue.value = '{}'
        }
      }
    }
  }
)
</script>

<template>
  <ScalarModal
    size="xl"
    :state="state"
    @cancel="emit('cancel')">
    <div class="flex h-[600px] flex-col">
      <!-- Header -->
      <div class="border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Environment Management
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your environment variables and configurations
        </p>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar - Environment List -->
        <div class="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div class="p-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-medium text-gray-900 dark:text-white">Environments</h3>
              <ScalarButton
                size="sm"
                variant="outlined"
                @click="environmentModal.show()">
                <ScalarIcon
                  icon="Add"
                  size="xs" />
                Add
              </ScalarButton>
            </div>
            
            <div class="space-y-2 max-h-96 overflow-y-auto">
              <div
                v-for="env in allEnvironments"
                :key="`${env.collectionId}-${env.name}`"
                class="environment-item"
                :class="{
                  'environment-item--selected': 
                    selectedEnvironment === env.name && selectedCollection === env.collectionId
                }"
                @click="selectEnvironment(env)">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: env.color }" />
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {{ env.name }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ env.collectionName }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div
                v-if="allEnvironments.length === 0"
                class="text-center py-8 text-gray-500 dark:text-gray-400">
                <ScalarIcon
                  class="mx-auto mb-2 opacity-50"
                  icon="Brackets"
                  size="lg" />
                <p class="text-sm">No environments found</p>
                <p class="text-xs">Create your first environment to get started</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content - Environment Editor -->
        <div class="flex-1 flex flex-col">
          <div
            v-if="!currentEnvironment"
            class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div class="text-center">
              <ScalarIcon
                class="mx-auto mb-4 opacity-50"
                icon="Brackets"
                size="xl" />
              <h3 class="text-lg font-medium mb-2">Select an Environment</h3>
              <p class="text-sm">Choose an environment from the sidebar to edit its variables</p>
            </div>
          </div>
          
          <div
            v-else
            class="flex-1 flex flex-col">
            <!-- Environment Header -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div
                  class="w-4 h-4 rounded-full"
                  :style="{ backgroundColor: currentEnvironment.color }" />
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ currentEnvironment.name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ currentEnvironment.collectionName }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Environment Variables Editor -->
            <div class="flex-1 p-4">
              <div class="mb-3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Environment Variables (JSON)
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Define your environment variables as a JSON object. Example: <code class="bg-gray-100 dark:bg-gray-700 px-1 rounded">{"API_URL": "https://api.example.com", "API_KEY": "your-key-here"}</code>
                </p>
              </div>
              
              <div class="flex-1 min-h-0">
                <CodeInput
                  v-model="environmentValue"
                  class="h-full"
                  :envVariables="activeEnvVariables"
                  :environment="{
                    uid: currentEnvironment.name as any,
                    name: currentEnvironment.name,
                    value: JSON.stringify(currentEnvironment.variables),
                    color: currentEnvironment.color,
                  }"
                  language="json"
                  lineNumbers
                  lint
                  @update:modelValue="handleEnvironmentUpdate" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 p-4">
        <div class="flex justify-end gap-3">
          <ScalarButton
            variant="outlined"
            @click="emit('cancel')">
            Close
          </ScalarButton>
        </div>
      </div>
    </div>

    <!-- Environment Creation Modal -->
    <EnvironmentModal
      :activeWorkspaceCollections="activeWorkspaceCollections"
      :collectionId="undefined"
      :state="environmentModal"
      @cancel="environmentModal.hide()"
      @submit="handleEnvironmentSubmit" />
  </ScalarModal>
</template>

<style scoped>
.environment-item {
  padding: 12px;
  border-radius: var(--scalar-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--scalar-border-color);
  background: var(--scalar-background-1);
}

.environment-item:hover {
  background: var(--scalar-background-2);
}

.environment-item--selected {
  background: var(--scalar-background-2);
}
</style>
