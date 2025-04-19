import type { AnyApiReferenceConfiguration } from '@/api-reference/api-reference-configuration.ts'

/**
 * This is a subset of the vue app type
 * Didn't want to add vue as a dependency just for this type so we stub whatever we need for the html api
 */
type App<HostElement = any> = {
  mount(rootContainer: HostElement | string): unknown
  unmount(): void
  onUnmount(cb: () => void): void
}

/** Enhanced ApiReferenceInstance with subset vue app */
export type ApiReferenceInstance = {
  /** The vue app instance */
  app: App<Element>
  /** Destroy the current API Reference instance */
  destroy: () => void
  /** Get the current configuration[s] */
  getConfiguration: () => AnyApiReferenceConfiguration
  /** Update all configuration[s] */
  updateConfiguration: (newConfig: AnyApiReferenceConfiguration) => void
}

/** Function overload for createApiReference to allow multiple different signatures */
export type CreateApiReference = {
  /** Pass in the configuration only */
  (configuration: AnyApiReferenceConfiguration): ApiReferenceInstance
  /** Pass in the element or selector and configuration */
  (elementOrSelector: Element | string, configuration: AnyApiReferenceConfiguration): ApiReferenceInstance
  /** Pass in the element or selector, configuration and name for global registration, name is required when you have more than one page with a reference */
  (elementOrSelector: Element | string, configuration: AnyApiReferenceConfiguration, name: string): ApiReferenceInstance
}

/** Scalar global object which lives at window.Scalar */
export type ScalarGlobal = {
  /** Create a new API Reference instance */
  createApiReference: CreateApiReference
  /** Globally registered API Reference instances */
  apps: Record<string, ApiReferenceInstance>
}
