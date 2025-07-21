/**
 * Simple demo page for all Scalar code highlighting functions
 */
import { presets } from '@scalar/themes'

import '@scalar/themes/base.css'
import '@scalar/themes/style.css'

import { syntaxHighlight } from '../src/code'
// @ts-expect-error vite not looking for raw types
import codeExampleLarge from '../src/constants?raw'

import '../src/css/code.css'

import { standardLanguages } from '../src/languages'
import { htmlFromMarkdown } from '../src/markdown/markdown'
// @ts-expect-error vite not looking for raw types
import markdownFile from './markdown-test.md?raw'

/** Create a section break header */
function createHeader(text: string) {
  const header = document.createElement('h2')
  header.classList.add('section-header')
  header.innerHTML = text
  document.body.appendChild(header)
}

function createCodeBlock(content: string, name: string, lang: string, mask?: string[]) {
  createHeader(name)
  const el = document.createElement('div')
  el.innerHTML = syntaxHighlight(content, {
    lang,
    languages: standardLanguages,
    lineNumbers: true,
    maskCredentials: mask,
  })
  document.body.appendChild(el)
}

document.getElementById('dark-mode-btn')?.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode')
  document.body.classList.toggle('light-mode')
})

const styleSheet = new CSSStyleSheet()
styleSheet.replaceSync(presets.deepSpace.theme)
document.adoptedStyleSheets.push(styleSheet)

// ---------------------------------------------------------------------------
// Codeblock example

createCodeBlock(
  `const data = JSON.stringify({
  id: 1,
  name: 'Mars',
  description: 'The red planet',
  image: 'https://cdn.scalar.com/photos/mars.jpg',
  creator: {
    id: 1,
    name: 'Marc',
    email: 'marc@scalar.com'
  }
});

const xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener('readystatechange', function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open('POST', 'https://galaxy.scalar.com/planets');
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.setRequestHeader('Authorization', 'Bearer YOUR_SECRET_TOKEN');

xhr.send(data);
`,
  'Basic Codeblock',
  'js',
)

createCodeBlock(codeExampleLarge, 'Longer Codeblock with Credential Masking', 'ts', ['javascript'])

// ---------------------------------------------------------------------------
// HTML
createCodeBlock(
  `<div id="wrap" class="my-name">
  Some <b>html</b> content is also highlighted
</div>
`,
  'HTML',
  'html',
)

// ---------------------------------------------------------------------------
// CSS

createCodeBlock(
  `code.hljs * {
  font-size: var(--scalar-small) !important;
  font-family: var(--scalar-font-code) !important;
  text-align: left;
  white-space: pre;
  word-spacing: normal;
  word-break: normal;
  word-wrap: normal;
  line-height: 1.4;
  tab-size: 4;
}
code.hljs {
  display: inline-block;
  counter-reset: linenumber;
}
`,
  'CSS',
  'css',
)

// ---------------------------------------------------------------------------
// Kotlin

const kotlin = String.raw`val client = OkHttpClient()

val mediaType = MediaType.parse("application/json")
val body = RequestBody.create(mediaType, "{\n  \"name\": \"Marc\",\n  \"email\": \"marc@scalar.com\",\n  \"password\": \"i-love-scalar\"\n}")
val request = Request.Builder()
  .url("https://galaxy.scalar.com/user/signup")
  .post(body)
  .addHeader("Content-Type", "application/json")
  .build()

val response = client.newCall(request).execute()`

createCodeBlock(kotlin, 'Kotlin', 'kotlin')

// ---------------------------------------------------------------------------
// Curl

const shellString = String.raw`curl --request POST \
  --url https://galaxy.scalar.com/user/signup \
  --header 'Content-Type: application/json' \
  --data '{
  "name": "Marc",
  "email": "marc@scalar.com",
  "password": "i-love-scalar"
}'`

createCodeBlock(shellString, 'Curl', 'curl')

// ---------------------------------------------------------------------------
// C#

const csharp = String.raw`
using System.Net.Http.Headers;
var client = new HttpClient();
var request = new HttpRequestMessage
{
    Method = HttpMethod.Post,
    RequestUri = new Uri("https://galaxy.scalar.com/user/signup"),
    Content = new StringContent("{\n  \"name\": \"Marc\",\n  \"email\": \"marc@scalar.com\",\n  \"password\": \"i-love-scalar\"\n}")
    {
        Headers =
        {
            ContentType = new MediaTypeHeaderValue("application/json")
        }
    }
};
using (var response = await client.SendAsync(request))
{
    response.EnsureSuccessStatusCode();
    var body = await response.Content.ReadAsStringAsync();
    Console.WriteLine(body);
}

var client = new RestClient("https://galaxy.scalar.com/planets");
var request = new RestRequest(Method.POST);
request.AddHeader("Content-Type", "application/json");
request.AddHeader("Authorization", "Bearer YOUR_SECRET_TOKEN");
request.AddParameter("application/json", "{\n  \"id\": 1,\n  \"name\": \"Mars\",\n  \"description\": \"The red planet\",\n  \"image\": \"https://cdn.scalar.com/photos/mars.jpg\",\n  \"creator\": {\n    \"id\": 1,\n    \"name\": \"Marc\",\n    \"email\": \"marc@scalar.com\"\n  }\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
`

createCodeBlock(csharp, 'C#', 'c++')

// ---------------------------------------------------------------------------
// PHP

const php = String.raw`<?php

$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "https://galaxy.scalar.com/planets",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => json_encode([
    'id' => 1,
    'name' => 'Mars',
    'description' => 'The red planet',
    'image' => 'https://cdn.scalar.com/photos/mars.jpg',
    'creator' => [
        'id' => 1,
        'name' => 'Marc',
        'email' => 'marc@scalar.com'
    ]
  ]),
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_SECRET_TOKEN",
    "Content-Type: application/json"
  ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}`

createCodeBlock(php, 'PHP', 'php')

// ---------------------------------------------------------------------------
// Objective C

const oc = String.raw`#import <Foundation/Foundation.h>

NSDictionary *headers = @{ @"Content-Type": @"application/json",
                           @"Authorization": @"Bearer YOUR_SECRET_TOKEN" };
NSDictionary *parameters = @{ @"id": @1,
                              @"name": @"Mars",
                              @"description": @"The red planet",
                              @"image": @"https://cdn.scalar.com/photos/mars.jpg",
                              @"creator": @{ @"id": @1, @"name": @"Marc", @"email": @"marc@scalar.com" } };

NSData *postData = [NSJSONSerialization dataWithJSONObject:parameters options:0 error:nil];

NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:@"https://galaxy.scalar.com/planets"]
                                                       cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                   timeoutInterval:10.0];
[request setHTTPMethod:@"POST"];
[request setAllHTTPHeaderFields:headers];
[request setHTTPBody:postData];

NSURLSession *session = [NSURLSession sharedSession];
NSURLSessionDataTask *dataTask = [session dataTaskWithRequest:request
                                            completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
                                                if (error) {
                                                    NSLog(@"%@", error);
                                                } else {
                                                    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *) response;
                                                    NSLog(@"%@", httpResponse);
                                                }
                                            }];
[dataTask resume];`

createCodeBlock(oc, 'Objective C', 'objectivec')

// ---------------------------------------------------------------------------
// Powershell

const pshell = String.raw`$headers=@{}
$headers.Add("Content-Type", "application/json")
$headers.Add("Authorization", "Bearer YOUR_SECRET_TOKEN")
$response = Invoke-WebRequest -Uri 'https://galaxy.scalar.com/planets' -Method POST -Headers $headers -ContentType 'application/json' -Body '{
  "id": 1,
  "name": "Mars",
  "description": "The red planet",
  "image": "https://cdn.scalar.com/photos/mars.jpg",
  "creator": {
    "id": 1,
    "name": "Marc",
    "email": "marc@scalar.com"
  }
}'`

createCodeBlock(pshell, 'Powershell', 'powershell')

// ---------------------------------------------------------------------------
// Python

const py = String.raw`import requests

url = "https://galaxy.scalar.com/planets"

payload = {
    "id": 1,
    "name": "Mars",
    "description": "The red planet",
    "image": "https://cdn.scalar.com/photos/mars.jpg",
    "creator": {
        "id": 1,
        "name": "Marc",
        "email": "marc@scalar.com"
    }
}
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_SECRET_TOKEN"
}

response = requests.post(url, json=payload, headers=headers)

print(response.json())`

createCodeBlock(py, 'Python', 'python')
// ---------------------------------------------------------------------------
// Markdown render example

createHeader('Markdown')
const markdown = document.createElement('div')
markdown.classList.add('markdown')
markdown.innerHTML = await htmlFromMarkdown(markdownFile)
document.body.appendChild(markdown)
