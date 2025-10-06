<script setup lang="ts">
import { ScalarIcon, useModal } from '@scalar/components'

import EnvironmentManagementModal from '@/features/environment-management/components/EnvironmentManagementModal.vue'
import { useActiveEntities } from '@/store'

const { activeWorkspaceCollections } = useActiveEntities()
const environmentManagementModal = useModal()


function openEnvironmentManagement() {
  environmentManagementModal.show()
}
</script>

<template>
  <button
    class="environment-management-button"
    type="button"
    @click="openEnvironmentManagement">
    <ScalarIcon
      icon="Brackets"
      size="xs"
      thickness="2.5" />
    Manage Environments
  </button>
  
  <!-- Environment Management Modal -->
  <EnvironmentManagementModal
    :activeWorkspaceCollections="activeWorkspaceCollections"
    :state="environmentManagementModal"
    @cancel="environmentManagementModal.hide()" />
</template>

<style scoped>
.environment-management-button {
  cursor: pointer;
  width: 100%;
  padding: 9px 12px;
  height: 31px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: var(--scalar-mini);
  font-weight: var(--scalar-semibold);
  line-height: 1.385;
  text-decoration: none;
  border-radius: var(--scalar-radius);
  box-shadow: 0 0 0 0.5px var(--scalar-border-color);
  gap: 6px;
  color: var(--scalar-sidebar-color-1);
  background: transparent;
  border: none;
}

.environment-management-button:hover {
  background: var(
    --scalar-sidebar-item-hover-background,
    var(--scalar-background-2)
  );
}
</style>
