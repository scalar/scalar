import { reactive, ref } from 'vue'

export enum ActionModalTab {
  Request = 'Request name / type',
  Folder = 'Add folder to your workspace',
  Import = 'Import OpenAPI file to your workspace',
  Collection = 'Add collection to your workspace',
  Variant = 'Add variant to your workspace',
}

export type ActionModalState = ReturnType<typeof useActionModal>

export const useActionModal = () => {
  const tab = ref<ActionModalTab>(ActionModalTab.Request)
  const open = ref<boolean>(false)

  return reactive({
    open,
    tab,
    show() {
      open.value = true
    },
    hide() {
      open.value = false
    },
    activeTab(activeTab: ActionModalTab): void {
      tab.value = activeTab
    },
  })
}
