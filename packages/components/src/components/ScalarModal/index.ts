import { default as ScalarModal, useModal } from './ScalarModal.vue'

export { default as ScalarNativeDialog } from './ScalarNativeDialog.vue'
export { ScalarModal, useModal }

export type ModalState = ReturnType<typeof useModal>
