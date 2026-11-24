/** Expand every combination of server variable values. Undefined keeps a placeholder and an empty array drops the expansion. */
export const expandServerVariables = (
  template: string,
  getValues: (name: string) => readonly string[] | undefined,
): string[] => {
  const placeholder = /\{([^{}]+)\}/g
  const names = new Set([...template.matchAll(placeholder)].map(([, name]) => name!))

  const combinations = [...names].reduce<Map<string, string>[]>(
    (expanded, name) => {
      const values = getValues(name)
      if (values === undefined) {
        return expanded
      }

      const uniqueValues = [...new Set(values)]
      return expanded.flatMap((combination) => uniqueValues.map((value) => new Map([...combination, [name, value]])))
    },
    [new Map()],
  )

  // Render from the original template so a value containing braces cannot introduce another substitution.
  return [
    ...new Set(
      combinations.map((values) => template.replace(placeholder, (match, name: string) => values.get(name) ?? match)),
    ),
  ]
}
