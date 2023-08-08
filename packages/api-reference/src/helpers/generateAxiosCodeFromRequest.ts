type HarRequestHeader = {
  name: string
  value: string
}

type HarRequest = {
  url: string
  method: string
  headers?: HarRequestHeader[]
}

export const generateAxiosCodeFromRequest = (request: HarRequest) => {
  const lines: string[] = []

  lines.push(`import axios from 'axios'`)
  lines.push(``)
  lines.push(`axios({`)

  const url = request.url
  lines.push(`  url: '${url}',`)

  const method = request.method.toLowerCase()
  lines.push(`  method: '${method}',`)

  if (request.headers) {
    const headers = request.headers
      .map((header) => {
        return `    '${header.name}': '${header.value}',`
      })
      .join('\n')

    lines.push(`  headers: [`)
    lines.push(`${headers}`)
    lines.push(`  ],`)
  }

  lines.push(`}).then(response => {`)
  lines.push(`  console.log(response)`)
  lines.push(`})`)

  return lines.join('\n')
}
