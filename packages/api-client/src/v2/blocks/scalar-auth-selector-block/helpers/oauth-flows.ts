import { isHidden } from '@scalar/workspace-store/helpers/is-hidden'

/**
 * A single OAuth2 flow entry as far as the auth UI is concerned. Flows may carry the shared
 * display-order (`x-order`) and ignore (`x-scalar-ignore` / `x-internal`) extensions.
 */
type OrderableFlow = {
  'x-order'?: number
  'x-internal'?: boolean
  'x-scalar-ignore'?: boolean
}

/**
 * Returns the OAuth2 flow keys to show in the auth UI, in display order.
 *
 * Flows marked with `x-scalar-ignore` (or `x-internal`) are dropped. The rest are sorted by
 * `x-order` ascending, with ordered flows first and unordered flows keeping their document order.
 * The first key in the result is the default (pre-selected) flow tab, so giving a flow the lowest
 * `x-order` both moves it to the front and makes it the default.
 */
export const getVisibleOrderedFlowKeys = <T extends Record<string, OrderableFlow | undefined>>(
  flows: T | undefined,
): (keyof T)[] => {
  if (!flows) {
    return []
  }

  return (Object.entries(flows) as [keyof T & string, OrderableFlow | undefined][])
    .filter((entry): entry is [keyof T & string, OrderableFlow] => entry[1] !== undefined && !isHidden(entry[1]))
    .map(([key, flow], index) => ({ key, order: flow['x-order'], index }))
    .sort((a, b) => {
      // Both ordered: ascending by x-order.
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order
      }
      // Only one ordered: the ordered flow comes first.
      if (a.order !== undefined) {
        return -1
      }
      if (b.order !== undefined) {
        return 1
      }
      // Neither ordered: keep the original document order.
      return a.index - b.index
    })
    .map((entry) => entry.key)
}
