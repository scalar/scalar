/** Expand server variables within the remaining budget, or return undefined if the combinations would exceed it. */
export const expandServerVariables = (
  template: string,
  getValues: (name: string) => Iterable<string> | undefined,
  remaining = Number.MAX_SAFE_INTEGER,
): { urls: string[]; combinationCount: number } | undefined => {
  const placeholder = /\{([^{}]+)\}/g
  const names = new Set([...template.matchAll(placeholder)].map(([, name]) => name!))
  const dimensions: [name: string, values: string[]][] = []
  let combinationCount = 1

  for (const name of names) {
    const values = getValues(name)
    if (values === undefined) {
      continue
    }

    const unique = new Set<string>()
    const maxValues = Math.floor(remaining / combinationCount)
    for (const value of values) {
      unique.add(value)
      if (unique.size > maxValues) {
        return undefined
      }
    }
    if (unique.size === 0) {
      return { urls: [], combinationCount: 0 }
    }
    dimensions.push([name, [...unique]])
    combinationCount *= unique.size
  }

  // A plain URL still consumes one slot. Check before rendering any combination.
  if (combinationCount > remaining) {
    return undefined
  }

  // Change the last variable fastest to preserve enum order without storing every combination.
  dimensions.reverse()
  const substitutions = new Map<string, string>()
  const urls = new Set<string>()
  for (let index = 0; index < combinationCount; index++) {
    let choice = index
    for (const [name, values] of dimensions) {
      substitutions.set(name, values[choice % values.length]!)
      choice = Math.floor(choice / values.length)
    }
    // Substitute only placeholders present in the original template.
    urls.add(template.replace(placeholder, (match, name: string) => substitutions.get(name) ?? match))
  }

  return { urls: [...urls], combinationCount }
}
