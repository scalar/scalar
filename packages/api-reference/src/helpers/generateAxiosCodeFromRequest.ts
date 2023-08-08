export const generateAxiosCodeFromRequest = (request: any) => {
  const lines = []

  lines.push(`import axios from 'axios'`)
  lines.push(``)
  lines.push(`axios({`)

  const url = request.url
  lines.push(`  url: '${url}',`)

  const method = request.method.toLowerCase()
  lines.push(`  method: '${method}',`)

  if (request.headers) {
    const headers = request.headers
      .map((header: { name: string; value: string }) => {
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
