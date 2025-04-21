import { createApiReference } from '@/standalone/lib/html-api'
import type { CreateApiReference } from '@scalar/types/api-reference'

// Register the createApiReference function in the global Scalar object (new)
declare global {
  interface Window {
    Scalar: {
      createApiReference: CreateApiReference
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
  }
}
