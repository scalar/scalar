type ApplyTransform<T, Transform> = Transform extends 'NonNullable'
  ? NonNullable<T>
  : Transform extends 'Partial'
    ? Partial<T>
    : Transform extends 'Required'
      ? Required<T>
      : Transform extends 'Readonly'
        ? Readonly<T>
        : // fallback to original type
          T

export type DeepTransform<T, Transform> = T extends (...args: any[]) => any
  ? T
  : T extends Array<infer U>
    ? Array<DeepTransform<U, Transform>>
    : T extends object
      ? { [K in keyof T]-?: DeepTransform<ApplyTransform<NonNullable<T[K]>, Transform>, Transform> }
      : ApplyTransform<NonNullable<T>, Transform>

export type MutableArray<T extends readonly any[]> = {
  -readonly [k in keyof T]: T[k]
}
