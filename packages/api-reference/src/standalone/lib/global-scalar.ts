type AnyObject = Record<string, any>
type AnyFunction = (...args: any[]) => any

/**
 * Register any method on the global window.Scalar object
 */
export function registerScalar(method: AnyFunction) {
  if (typeof window !== 'object') {
    return
  }

  const globalWindow = window as AnyObject

  // Initialize the global Scalar object
  globalWindow.Scalar = globalWindow.Scalar || {}

  // Register the method
  globalWindow.Scalar[method.name] = method
}
