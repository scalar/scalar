import { createApiReference, type ApiReferenceInstance, type CreateApiReference } from '@/standalone/lib/html-api'

// Register the createApiReference function in the global Scalar object (new)
declare global {
  interface Window {
    Scalar: {
      createApiReference: CreateApiReference
      /** Globally registered API Reference instances */
      apps: Record<string, ApiReferenceInstance>
    }
  }
}

/** Register any method on the global window.Scalar object, ensure the type is added to the window above */
export const registerGlobals = () => {
  if (typeof window !== 'object') {
    return
  }

  const globalWindow = window

  // Initialize the global Scalar object
  globalWindow.Scalar = {
    createApiReference,
    apps: {},
  }
}
