type HarRequest = {
  url: string
  method: string
}

export const generateLaravelCodeFromRequest = (request: HarRequest) => {
  const lines: string[] = []

  lines.push(`<?php`)
  lines.push(``)
  lines.push(`use Illuminate\\Support\\Facades\\Http;`)
  lines.push(``)

  const method = request.method.toLowerCase()
  const url = request.url

  lines.push(`$response = Http::${method}('${url}');`)

  return lines.join('\n')
}
