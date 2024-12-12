export type ReducedHelperObject = Record<string, string[] | string>
export declare const reducer: <
  T extends {
    name: string
    value?: string | undefined
  },
>(
  accumulator: ReducedHelperObject,
  pair: T,
) => ReducedHelperObject
