import type { ComputedRef } from 'vue'
import { computed } from 'vue'

import { useState } from '@/state/state'

/**
 * Agent Scalar signup/upgrade URL for both full (agent.scalar.com) and embedded
 * (@scalar/api-reference) modes.
 *
 * In embedded mode, includes register flow and optional docUrl when a temporary document was uploaded.
 */
export function useSignupLink(): {
  signupLink: ComputedRef<string>
  navigateToSignup: () => void
} {
  const { dashboardUrl, mode, uploadedTmpDocumentUrl } = useState()

  const signupLink = computed(() => {
    // we use mode 'full' on agent.scalar.com
    if (mode === 'full') {
      return dashboardUrl
    }

    // we use mode 'preview' in @scalar/api-reference
    return uploadedTmpDocumentUrl.value
      ? `${dashboardUrl}/register?flow=oss-agent&docUrl=${uploadedTmpDocumentUrl.value}`
      : dashboardUrl
  })

  function navigateToSignup() {
    window.location.assign(signupLink.value)
  }

  return { signupLink, navigateToSignup }
}
