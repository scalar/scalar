import { onMounted, ref } from 'vue'

const TERMS_AND_CONDITIONS_LS_KEY = 'scalar/agent-terms-accepted'

export function useTermsAndConditions() {
  const accepted = ref(false)

  onMounted(() => {
    accepted.value = localStorage.getItem(TERMS_AND_CONDITIONS_LS_KEY) === 'true'
  })

  function accept() {
    accepted.value = true
    localStorage.setItem(TERMS_AND_CONDITIONS_LS_KEY, 'true')
  }

  return { accepted, accept }
}
