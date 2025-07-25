import { createApiClientWeb as createApiClient } from '@/layouts/Web'

// Register the createApiReference function in the global Scalar object (new)
declare global {
  interface Window {
    Scalar: {
      createApiClient: typeof createApiClient
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
    createApiClient,
  }
}
