// TODO: Oh, do we want to make this a dependency?
// import type { Component } from 'vue'

export type OpenApiExtension = {
  /**
   * The name of the OpenAPI extension
   */
  name: `x-${string}`
  /**
   * The component to render the OpenAPI extension
   */
  component: any
  // component: Component
}

export type ApiReferencePlugin = () => {
  name: string
  extensions: OpenApiExtension[]
}
