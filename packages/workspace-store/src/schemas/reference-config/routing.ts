import { Type, type Static } from '@sinclair/typebox'

export const RoutingSchema = Type.Partial(
  Type.Object({
    basePath: Type.String(),
    pathNotFound: Type.String(),
  }),
)

export type Routing = Static<typeof RoutingSchema>

export const defaultRouting: Required<Routing> = {
  basePath: '/',
  pathNotFound: '/',
}
