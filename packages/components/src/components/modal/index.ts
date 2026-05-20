import { default as ScalarModal, useModal } from './ScalarModal.vue'

export { ScalarModal, useModal }

export type ModalState = ReturnType<typeof useModal>
