import type { HarRequest } from '@scalar/types/snippetz'
import { describe, expect, it } from 'vitest'

import { clients } from './index'

// Each target must read both files instead of transmitting the @filename placeholder.
const fileReads: Record<string, string> = {
  'c/libcurl': 'curl_mime_filedata(part, "FILE");',
  'csharp/httpclient': 'new StreamContent(File.OpenRead("FILE"))',
  'csharp/restsharp': 'request.AddFile("upload", "FILE", "application/octet-stream")',
  'clojure/clj_http': '(clojure.java.io/file "FILE")',
  'dart/http':
    'http.MultipartFile.fromPath("upload", "FILE", contentType: MediaType.parse("application/octet-stream"))',
  'fsharp/httpclient': 'new StreamContent(File.OpenRead("FILE"))',
  'go/native': 'os.Open("FILE")',
  'http/http1.1': '< FILE\r\n',
  'java/asynchttp': 'java.nio.file.Files.readAllBytes(java.nio.file.Path.of("FILE"))',
  'java/nethttp': 'java.nio.file.Files.readAllBytes(java.nio.file.Path.of("FILE"))',
  'java/unirest': 'java.nio.file.Files.readAllBytes(java.nio.file.Path.of("FILE"))',
  'java/okhttp': 'new java.io.File("FILE")',
  'kotlin/okhttp': 'File("FILE")',
  'julia/http': 'HTTP.Multipart("FILE", open("FILE"), "application/octet-stream")',
  'objc/nsurlsession': '[NSData dataWithContentsOfFile:@"FILE"]',
  'ocaml/cohttp': 'Lwt_io.with_file ~mode:Lwt_io.Input "FILE" Lwt_io.read',
  'php/curl': "file_get_contents('FILE')",
  'php/guzzle': "fopen('FILE', 'rb')",
  'php/laravel': "file_get_contents('FILE')",
  'powershell/webrequest': "[System.IO.File]::ReadAllBytes('FILE')",
  'powershell/restmethod': "[System.IO.File]::ReadAllBytes('FILE')",
  'python/python3': 'open("FILE", "rb").read()',
  'python/requests': '("upload", ("FILE", open("FILE", "rb"), "application/octet-stream"))',
  'python/httpx_sync': '("upload", ("FILE", open("FILE", "rb"), "application/octet-stream"))',
  'python/httpx_async': '("upload", ("FILE", open("FILE", "rb"), "application/octet-stream"))',
  'python/aiohttp':
    'data.add_field("upload", open("FILE", "rb"), filename="FILE", content_type="application/octet-stream")',
  'r/httr2': '"upload" = curl::form_file("FILE", type = "application/octet-stream")',
  'ruby/native': "File.open('FILE', 'rb')",
  'rust/reqwest': 'reqwest::multipart::Part::bytes(std::fs::read("FILE")?)',
  'shell/curl': "--form 'upload=@FILE;type=application/octet-stream'",
  'shell/wget': "cat -- 'FILE'",
  'shell/httpie': "cat -- 'FILE'",
  'swift/nsurlsession': 'body.append(try Data(contentsOf: URL(fileURLWithPath: "FILE")))',
  'js/fetch': 'new File([files[INDEX]], "FILE", { type: "application/octet-stream" })',
  'js/axios': 'new File([files[INDEX]], "FILE", { type: "application/octet-stream" })',
  'js/ofetch': 'new File([files[INDEX]], "FILE", { type: "application/octet-stream" })',
  'js/jquery': 'new File([files[INDEX]], "FILE", { type: "application/octet-stream" })',
  'js/xhr': 'new File([files[INDEX]], "FILE", { type: "application/octet-stream" })',
  'node/fetch': 'new File([readFileSync("FILE")], "FILE", { type: "application/octet-stream" })',
  'node/axios': 'new File([readFileSync("FILE")], "FILE", { type: "application/octet-stream" })',
  'node/ofetch': 'new File([readFileSync("FILE")], "FILE", { type: "application/octet-stream" })',
  'node/undici': 'new File([readFileSync("FILE")], "FILE", { type: "application/octet-stream" })',
}
const plugins = clients.flatMap((target) =>
  target.clients.map((plugin) => ({ id: `${target.key}/${plugin.client}`, plugin })),
)

describe('index', () => {
  it('covers every registered client in the multipart upload regression', () => {
    expect(Object.keys(fileReads).sort()).toStrictEqual(plugins.map(({ id }) => id).sort())
  })

  it.each(plugins)('reads repeated file parts and preserves literal text for $id', ({ id, plugin }) => {
    const request: Partial<HarRequest> = {
      url: 'https://api.example.invalid/',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          { name: 'upload', fileName: 'payload.bin', value: '@payload.bin', contentType: 'application/octet-stream' },
          { name: 'upload', fileName: 'second.bin', value: '@second.bin', contentType: 'application/octet-stream' },
          { name: 'note', value: '@scalar' },
        ],
      },
    }
    const snippet = plugin.generate(request)
    for (const [index, filename] of ['payload.bin', 'second.bin'].entries()) {
      expect(snippet).toContain(fileReads[id]!.replaceAll('FILE', filename).replaceAll('INDEX', String(index)))
    }
    const code = snippet
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
    expect(code.match(/\bupload\b/g)).toStrictEqual(['upload', 'upload'])
    expect(snippet).toContain('@scalar')
    if (id !== 'shell/curl') {
      expect(snippet.includes('@payload.bin')).toBe(false)
      expect(snippet.includes('@second.bin')).toBe(false)
    }
    const runtimeBoundaries: Record<string, string> = {
      'java/asynchttp': 'String boundary = java.util.UUID.randomUUID().toString();',
      'java/nethttp': 'String boundary = java.util.UUID.randomUUID().toString();',
      'java/unirest': 'String boundary = java.util.UUID.randomUUID().toString();',
      'objc/nsurlsession': 'NSString *boundary = [[NSUUID UUID] UUIDString];',
      'ocaml/cohttp': 'Random.self_init ();',
      'php/curl': '$boundary = bin2hex(random_bytes(16));',
      'powershell/webrequest': "$boundary = [guid]::NewGuid().ToString('N')",
      'powershell/restmethod': "$boundary = [guid]::NewGuid().ToString('N')",
      'shell/httpie': 'od -An -N16 -tx1 /dev/urandom',
      'shell/wget': 'od -An -N16 -tx1 /dev/urandom',
      'http/http1.1': '@boundary = {{$guid}}',
      'python/python3': 'boundary = uuid.uuid4().hex',
    }
    if (runtimeBoundaries[id]) {
      expect(snippet).toContain(runtimeBoundaries[id])
      expect(snippet).toContain('multipart/form-data; boundary=')
    }
    if (id === 'python/python3') {
      expect(snippet).toContain('headers["Content-Type"] = "multipart/form-data; boundary=" + boundary')
      expect(snippet).toContain('data_list.append(("--" + boundary + "--").encode("utf-8"))')
    }
    if (id === 'swift/nsurlsession') {
      expect(snippet).toContain('let boundary = UUID().uuidString')
      expect(snippet).toContain('multipart/form-data; boundary=\\(boundary)')
      expect(snippet).toContain('appendToBody("--\\(boundary)--\\r\\n")')
    }
  })
})
