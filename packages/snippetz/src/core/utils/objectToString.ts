import { isKeyNeedsQuotes } from './isKeyNeedsQuotes'

export function objectToString(obj: Record<string, any>, indent = 0): string {
  const parts = []
  const indentation = ' '.repeat(indent)
  const innerIndentation = ' '.repeat(indent + 2)

  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = isKeyNeedsQuotes(key) ? `'${key}'` : key

    if (Array.isArray(value)) {
      const arrayString = value
        .map((item) => {
          if (typeof item === 'string') {
            return `'${item}'`
          } else if (item && typeof item === 'object') {
            return objectToString(item, indent + 2)
          } else {
            return item
          }
        })
        .join(`, ${innerIndentation}`)
      parts.push(`${innerIndentation}${formattedKey}: [${arrayString}]`)
    } else if (value && typeof value === 'object') {
      parts.push(
        `${innerIndentation}${formattedKey}: ${objectToString(
          value,
          indent + 2,
        )}`,
      )
    } else if (typeof value === 'string') {
      let formattedValue = `${value}`

      if (value.startsWith('JSON.stringify')) {
        // If it has more than one line, add indentation to the other lines
        const lines = value.split('\n')

        if (lines.length > 1) {
          formattedValue = lines
            .map((line, index) => {
              if (index === 0) {
                return line
              }

              return `${innerIndentation}${line}`
            })
            .join('\n')
        }
      } else {
        formattedValue = `'${value}'`
      }

      parts.push(`${innerIndentation}${formattedKey}: ${formattedValue}`)
    } else {
      parts.push(`${innerIndentation}${formattedKey}: ${value}`)
    }
  }

  return `{\n${parts.join(',\n')}\n${indentation}}`
}
