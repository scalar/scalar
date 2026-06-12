import { describe, expect, it } from 'vitest'

import { syntaxHighlight } from '@/code'

import { standardLanguages } from './standard'

type SdkSample = {
  code: string
  expectedTokens: string[]
  lang: keyof typeof standardLanguages
  minCoverage: number
}

const samples = [
  {
    lang: 'kotlin',
    minCoverage: 0.48,
    code: String.raw`val client = OkHttpClient()
val body = RequestBody.create(MediaType.parse("application/json"), "{\"name\":\"Marc\"}")
val request = Request.Builder()
  .url("https://galaxy.scalar.com/user/signup")
  .post(body)
  .addHeader("Content-Type", "application/json")
  .build()
val response = client.newCall(request).execute()`,
    expectedTokens: [
      '<span class="hljs-title class_">OkHttpClient</span>',
      '<span class="hljs-title function_">parse</span>',
      '<span class="hljs-title function_">addHeader</span>',
      '<span class="hljs-title function_">execute</span>',
      '<span class="hljs-operator">=</span>',
    ],
  },
  {
    lang: 'ruby',
    minCoverage: 0.45,
    code: String.raw`require "uri"
require "net/http"

uri = URI("https://galaxy.scalar.com/user/signup")
https = Net::HTTP.new(uri.host, uri.port)
https.use_ssl = true
request = Net::HTTP::Post.new(uri)
request["Content-Type"] = "application/json"
response = https.request(request)
puts response.read`,
    expectedTokens: [
      '<span class="hljs-title class_">URI</span>',
      '<span class="hljs-title class_">Net</span>',
      '<span class="hljs-attr">new</span>',
      '<span class="hljs-attr">use_ssl</span>',
      '<span class="hljs-title function_">request</span>',
    ],
  },
  {
    lang: 'java',
    minCoverage: 0.48,
    code: String.raw`OkHttpClient client = new OkHttpClient();
MediaType mediaType = MediaType.parse("application/json");
RequestBody body = RequestBody.create(mediaType, "{\"name\":\"Marc\"}");
Request request = new Request.Builder()
  .url("https://galaxy.scalar.com/user/signup")
  .post(body)
  .addHeader("Content-Type", "application/json")
  .build();
Response response = client.newCall(request).execute();`,
    expectedTokens: [
      '<span class="hljs-title class_">OkHttpClient</span>',
      '<span class="hljs-title class_">RequestBody</span>',
      '<span class="hljs-title function_">addHeader</span>',
      '<span class="hljs-title function_">newCall</span>',
      '<span class="hljs-operator">=</span>',
    ],
  },
  {
    lang: 'csharp',
    minCoverage: 0.45,
    code: String.raw`using System.Net.Http.Headers;
var client = new HttpClient();
var request = new HttpRequestMessage
{
    Method = HttpMethod.Post,
    RequestUri = new Uri("https://galaxy.scalar.com/user/signup"),
    Content = new StringContent("{\"name\":\"Marc\"}")
};
using (var response = await client.SendAsync(request))
{
    response.EnsureSuccessStatusCode();
    Console.WriteLine(await response.Content.ReadAsStringAsync());
}`,
    expectedTokens: [
      '<span class="hljs-title class_">HttpClient</span>',
      '<span class="hljs-title class_">HttpRequestMessage</span>',
      '<span class="hljs-title function_">SendAsync</span>',
      '<span class="hljs-title function_">WriteLine</span>',
      '<span class="hljs-attr">Content</span>',
    ],
  },
  {
    lang: 'php',
    minCoverage: 0.6,
    code: String.raw`<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "https://galaxy.scalar.com/planets",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode(["name" => "Mars"]),
]);
$response = curl_exec($curl);
curl_close($curl);`,
    expectedTokens: [
      '<span class="hljs-title function_ invoke__">curl_init</span>',
      '<span class="hljs-title function_ invoke__">curl_setopt_array</span>',
      '<span class="hljs-title function_ invoke__">json_encode</span>',
      '<span class="hljs-title function_ invoke__">curl_exec</span>',
      '<span class="hljs-variable">$response</span>',
    ],
  },
  {
    lang: 'swift',
    minCoverage: 0.45,
    code: String.raw`let url = URL(string: "https://galaxy.scalar.com/user/signup")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
let task = URLSession.shared.dataTask(with: request) { data, response, error in
  if let data = data {
    print(String(data: data, encoding: .utf8)!)
  }
}
task.resume()`,
    expectedTokens: [
      '<span class="hljs-title class_">URL</span>',
      '<span class="hljs-title class_">URLRequest</span>',
      '<span class="hljs-title function_">setValue</span>',
      '<span class="hljs-attr">forHTTPHeaderField</span>',
      '<span class="hljs-title function_">resume</span>',
    ],
  },
  {
    lang: 'rust',
    minCoverage: 0.45,
    code: String.raw`let client = reqwest::Client::new();
let response = client
    .post("https://galaxy.scalar.com/user/signup")
    .header("Content-Type", "application/json")
    .json(&serde_json::json!({ "name": "Marc" }))
    .send()
    .await?;
println!("{}", response.text().await?);`,
    expectedTokens: [
      '<span class="hljs-title class_">Client</span>',
      '<span class="hljs-title function_">post</span>',
      '<span class="hljs-title function_">json</span>',
      '<span class="hljs-title function_">send</span>',
      '<span class="hljs-title function_">println!</span>',
    ],
  },
  {
    lang: 'dart',
    minCoverage: 0.45,
    code: String.raw`final request = http.Request("POST", Uri.parse("https://galaxy.scalar.com/user/signup"));
request.headers.addAll({
  "Content-Type": "application/json",
});
request.body = jsonEncode({"name": "Marc"});
final response = await request.send();
print(response.stream.bytesToString());`,
    expectedTokens: [
      '<span class="hljs-title class_">Request</span>',
      '<span class="hljs-title function_">parse</span>',
      '<span class="hljs-title function_">jsonEncode</span>',
      '<span class="hljs-title function_">send</span>',
      '<span class="hljs-attr">headers</span>',
    ],
  },
  {
    lang: 'cpp',
    minCoverage: 0.42,
    code: String.raw`CURL *curl = curl_easy_init();
struct curl_slist *headers = NULL;
headers = curl_slist_append(headers, "Content-Type: application/json");
curl_easy_setopt(curl, CURLOPT_URL, "https://galaxy.scalar.com/planets");
curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
CURLcode response = curl_easy_perform(curl);
std::string body = "Mars";
curl_easy_cleanup(curl);`,
    expectedTokens: [
      '<span class="hljs-title function_">curl_easy_init</span>',
      '<span class="hljs-title class_">curl_slist</span>',
      '<span class="hljs-variable constant_">CURLOPT_URL</span>',
      '<span class="hljs-title function_">curl_easy_perform</span>',
      '<span class="hljs-title class_">string</span>',
    ],
  },
] satisfies SdkSample[]

describe('sdk', () => {
  it.each(samples)(
    'highlights $lang SDK snippets with call-site coverage',
    ({ code, expectedTokens, lang, minCoverage }) => {
      const html = syntaxHighlight(code, {
        lang,
        languages: standardLanguages,
      })

      for (const token of expectedTokens) {
        expect(html).toContain(token)
      }

      expect(highlightedCoverage(html, code)).toBeGreaterThanOrEqual(minCoverage)
    },
  )
})

const highlightedCoverage = (html: string, source: string): number => {
  const highlightedChars = [...html.matchAll(/<span class="[^"]+">([^<]*)<\/span>/g)].reduce(
    (count, [, token]) => count + decodeHtml(token ?? '').replace(/\s/g, '').length,
    0,
  )
  const sourceChars = source.replace(/\s/g, '').length

  return Number((highlightedChars / sourceChars).toFixed(2))
}

const htmlEntities = {
  '&amp;': '&',
  '&gt;': '>',
  '&lt;': '<',
  '&quot;': '"',
  '&#x27;': "'",
} as const satisfies Record<string, string>

const decodeHtml = (value: string): string =>
  value.replace(/&(?:amp|gt|lt|quot|#x27);/g, (entity) => htmlEntities[entity as keyof typeof htmlEntities])
