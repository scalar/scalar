/** Expand every combination of server variable values. Undefined keeps a placeholder and an empty array drops the expansion. */
export const expandServerVariables = (
  template: string,
  getValues: (name: string) => readonly string[] | undefined,
): string[] => {
  const names = new Set([...template.matchAll(/\{([^{}]+)\}/g)].map(([, name]) => name!))

  return [...names].reduce<string[]>(
    (expanded, name) => {
      const values = getValues(name)
      if (values === undefined) {
        return expanded
      }

      return [
        ...new Set(
          expanded.flatMap((value) => values.map((replacement) => value.replaceAll(`{${name}}`, () => replacement))),
        ),
      ]
    },
    [template],
  )
}
