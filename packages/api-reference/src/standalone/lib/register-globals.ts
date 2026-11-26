import type { CreateApiReference } from '@scalar/types/api-reference'

import { createApiReference, releaseUnusedStyles } from '@/standalone/lib/html-api'

// Register the createApiReference function in the global Scalar object (new)
declare global {
  interface Window {
    Scalar: {
      createApiReference: CreateApiReference
      releaseUnusedStyles: () => void
    }
  }
}

/** Register any method on the global window.Scalar object, ensure the type is added to the window above */
export const registerGlobals = () => {
  if (typeof window !== 'object') {
    return
  }

  // Initialize the global Scalar object
  window.Scalar = {
    createApiReference,
    releaseUnusedStyles,
  }
}
