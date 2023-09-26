import { reactive } from 'vue'

export type ModalState = ReturnType<typeof useModal>

export const useModal = () =>
  reactive({
    open: false,
    show() {
      this.open = true
    },
    hide() {
      this.open = false
    },
  })
