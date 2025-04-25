// TODO: Make Zod Schema
// TODO: Add comment
export type ApiClientPlugin = () => {
  name: string
  views: {
    'request.section': {
      title?: string
      // TODO: Better type
      component: any
      props?: Record<string, any>
    }[]
    'response.section': {
      title?: string
      // TODO: Better type
      component: any
      props?: Record<string, any>
    }[]
  }
  hooks: {
    onBeforeRequest: () => void
    onResponseReceived: ({
      response,
      operation,
    }: {
      response: Response
      // TODO: How do we get a proper type here?
      operation: Record<string, any>
    }) => void
  }
}
