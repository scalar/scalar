import type { BodySegment } from './prepare-request'

/** Java literals need octal escapes for controls that Java processes before tokenization. */
export const quoteJava = (value: string): string =>
  `"${Array.from(value, (character) => {
    const code = character.charCodeAt(0)
    if (code < 32 && !['\n', '\r', '\t', '\b', '\f'].includes(character)) {
      return `\\${code.toString(8).padStart(3, '0')}`
    }
    return JSON.stringify(character).slice(1, -1)
  }).join('')}"`

/** Build a byte array while preserving binary file contents in multipart requests. */
export const javaBody = (body: BodySegment[] | undefined): string[] => {
  if (!body) {
    return []
  }
  return [
    'java.io.ByteArrayOutputStream body = new java.io.ByteArrayOutputStream();',
    ...body.map((segment) =>
      'file' in segment
        ? `body.write(java.nio.file.Files.readAllBytes(java.nio.file.Path.of(${quoteJava(segment.file)})));`
        : `body.write(${quoteJava(segment.text)}.getBytes(java.nio.charset.StandardCharsets.UTF_8));`,
    ),
    '',
  ]
}
