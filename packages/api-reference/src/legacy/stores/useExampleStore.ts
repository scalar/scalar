import { ref } from 'vue'

const selectedExampleKey = ref<string | undefined>()
const operationId = ref<string | undefined>()

export const useExampleStore = () => ({
  selectedExampleKey,
  operationId,
})
