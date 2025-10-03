import type { CodeMirrorLanguage } from '@scalar/use-codemirror'

export type MediaPreview = 'object' | 'image' | 'video' | 'audio'

export type MediaConfig = {
  preview?: MediaPreview
  alpha?: boolean
  raw?: boolean
  language?: CodeMirrorLanguage
  extension: string
}

/** Media Type (MIME Type) Definitions */
export const mediaTypes: { [type: string]: MediaConfig | undefined } = {
  'application/epub+zip': { extension: '.epub' },
  'application/gzip': { extension: '.gz' },
  'application/java-archive': { extension: '.jar' },
  'application/javascript': { extension: '.js', raw: true },
  'application/json': { extension: '.json', raw: true, language: 'json' },
  'application/ld+json': { extension: '.jsonld', raw: true, language: 'json' },
  'application/problem+json': {
    extension: '.json',
    raw: true,
    language: 'json',
  },
  'application/vnd.api+json': { extension: '.json', raw: true, language: 'json' },
  'application/dns-json': { extension: '.json', raw: true, language: 'json' },
  'application/msword': { extension: '.doc' },
  'application/octet-stream': { extension: '.bin' },
  'application/ogg': { extension: '.ogx' },
  'application/pdf': { extension: '.pdf', preview: 'object' },
  'application/rtf': { extension: '.rtf', raw: true },
  'application/vnd.amazon.ebook': { extension: '.azw' },
  'application/vnd.apple.installer+xml': {
    extension: '.mpkg',
    raw: true,
    language: 'xml',
  },
  'application/vnd.mozilla.xul+xml': {
    extension: '.xul',
    raw: true,
    language: 'xml',
  },
  'application/vnd.ms-excel': { extension: '.xls' },
  'application/vnd.ms-fontobject': { extension: '.eot' },
  'application/vnd.ms-powerpoint': { extension: '.ppt' },
  'application/vnd.oasis.opendocument.presentation': { extension: '.odp' },
  'application/vnd.oasis.opendocument.spreadsheet': { extension: '.ods' },
  'application/vnd.oasis.opendocument.text': { extension: '.odt' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    extension: '.pptx',
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extension: '.xlsx',
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extension: '.docx',
  },
  'application/vnd.rar': { extension: '.rar' },
  'application/vnd.visio': { extension: '.vsd' },
  'application/x-7z-compressed': { extension: '.7z' },
  'application/x-abiword': { extension: '.abw' },
  'application/x-bzip': { extension: '.bz' },
  'application/x-bzip2': { extension: '.bz2' },
  'application/x-cdf': { extension: '.cda' },
  'application/x-csh': { extension: '.csh' },
  'application/x-freearc': { extension: '.arc' },
  'application/x-httpd-php': { extension: '.php', raw: true },
  'application/x-sh': { extension: '.sh', raw: true },
  'application/x-tar': { extension: '.tar' },
  'application/xhtml+xml': { extension: '.xhtml', raw: true, language: 'html' },
  'application/xml': { extension: '.xml', raw: true, language: 'xml' },
  'application/yaml': { extension: '.yaml', raw: true, language: 'yaml' },
  'application/zip': { extension: '.zip' },
  'audio/aac': { extension: '.aac' },
  'audio/midi': { extension: '.midi' },
  'audio/mpeg': { extension: '.mp3', preview: 'audio' },
  'audio/ogg': { extension: '.oga' },
  'audio/wav': { extension: '.wav' },
  'audio/webm': { extension: '.weba' },
  'font/otf': { extension: '.otf' },
  'font/ttf': { extension: '.ttf' },
  'font/woff': { extension: '.woff' },
  'font/woff2': { extension: '.woff2' },
  'image/apng': { extension: '.apng', preview: 'image', alpha: true },
  'image/avif': { extension: '.avif', preview: 'image' },
  'image/bmp': { extension: '.bmp', preview: 'image' },
  'image/gif': { extension: '.gif', preview: 'image', alpha: true },
  'image/jpeg': { extension: '.jpg', preview: 'image' },
  'image/png': { extension: '.png', preview: 'image', alpha: true },
  'image/svg+xml': {
    extension: '.svg',
    raw: true,
    language: 'xml',
    preview: 'image',
    alpha: true,
  },
  'image/tiff': { extension: '.tiff' },
  'image/vnd.microsoft.icon': { extension: '.ico', preview: 'image' },
  'image/webp': { extension: '.webp', preview: 'image', alpha: true },
  'text/calendar': { extension: '.ics', raw: true },
  'text/css': { extension: '.css', raw: true, language: 'css' },
  'text/csv': { extension: '.csv', raw: true },
  'text/html': {
    extension: '.html',
    raw: true,
    language: 'html',
    preview: 'object',
  },
  'text/javascript': { extension: '.js', raw: true },
  'text/plain': { extension: '.txt', raw: true },
  'text/xml': { extension: '.xml', raw: true, language: 'xml' },
  'text/yaml': { extension: '.yaml', raw: true, language: 'yaml' },
  'video/3gpp': { extension: '.3gp' },
  'audio/3gpp': { extension: '.3gp' },
  'video/3gpp2': { extension: '.3g2' },
  'audio/3gpp2': { extension: '.3g2' },
  'video/mp2t': { extension: '.ts' },
  'video/mp4': { extension: '.mp4', preview: 'video' },
  'video/mpeg': { extension: '.mpeg' },
  'video/ogg': { extension: '.ogv' },
  'video/webm': { extension: '.webm', preview: 'video' },
  'video/x-msvideo': { extension: '.avi' },
}

/** Media Types (MIME Types) that can be displayed as raw text */
export const textMediaTypes: string[] = Object.entries(mediaTypes)
  .filter(([, config]) => config?.raw)
  .map(([type]) => type)

/** Get the config for a media type */
export function getMediaTypeConfig(type: string): MediaConfig | undefined {
  const config = mediaTypes[type]
  if (config) {
    return config
  }

  // Fallback for +json types
  if (type.endsWith('+json')) {
    return {
      extension: '.json',
      raw: true,
      language: 'json',
    }
  }

  return undefined
}

/** Check if a media type that can be displayed as raw text */
export function isTextMediaType(type: string): boolean {
  return !!getMediaTypeConfig(type)?.raw
}
