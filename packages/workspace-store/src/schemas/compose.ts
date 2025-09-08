import { type TSchema, Type } from '@scalar/typebox'

/**
 * Work around for: https://github.com/sinclairzx81/typebox/issues/1264
 */
export const compose = <A extends TSchema[]>(...args: A) => {
  return Type.Composite(args) as unknown as ReturnType<typeof Type.Intersect<A>>
}
