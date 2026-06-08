/**
 * Work out how many tabs fit inline given the width of each tab and the width
 * available to render them in.
 *
 * When everything fits, all tabs are shown. Otherwise we reserve room for the
 * "More" dropdown trigger and return how many tabs fit alongside it (always at
 * least one, so the row is never empty).
 */
export const getVisibleTabCount = (
  /** The natural width of each tab, in order */
  tabWidths: number[],
  /** The width available to render the tabs in */
  availableWidth: number,
  /** The width of the "More" dropdown trigger */
  moreWidth: number,
): number => {
  const total = tabWidths.length

  // Without a measurement yet, render everything and correct on the next pass
  if (availableWidth <= 0) {
    return total
  }

  const countThatFits = (reserved: number) => {
    let used = 0
    let count = 0

    for (const width of tabWidths) {
      if (used + width > availableWidth - reserved) {
        break
      }
      used += width
      count++
    }

    return count
  }

  // Everything fits, so there is no need for a "More" dropdown
  if (countThatFits(0) >= total) {
    return total
  }

  // Reserve room for the "More" trigger and keep at least one tab visible
  return Math.max(1, countThatFits(moreWidth))
}
