import { Type } from '@scalar/typebox'

export const RoutingSchema = Type.Partial(
  Type.Object({
    basePath: Type.String(),
    pathNotFound: Type.String(),
  }),
)

export type Routing = {
  basePath: string
  pathNotFound: string
}

export const defaultRouting: Routing = {
  basePath: '/',
  pathNotFound: '/',
}
