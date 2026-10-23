import { check } from './security.mjs'

const J = 'javascript'
const vectors = [
  // scripts and event handlers
  '<script>alert(1)</script>',
  '<SCRIPT SRC=//x.js></SCRIPT>',
  '<scr<script>ipt>alert(1)</script>',
  'a <script>alert(1)</script> b',
  '# H<script>x</script>',
  '<img src=x onerror=alert(1)>',
  '<IMG """><SCRIPT>alert(1)</SCRIPT>">',
  '<img src="x" onerror="alert(1)"//>',
  '<a href="#" onclick="alert(1)">x</a>',
  '<div onmouseover=alert(1)>x</div>',
  '<svg onload=alert(1)>',
  '<svg><script>alert(1)</script></svg>',
  '<math><mi><mglyph><style><img src=x onerror=alert(1)>',
  '<body onload=alert(1)>',
  '<details open ontoggle=alert(1)>',
  '<input onfocus=alert(1) autofocus>',
  '<input type=image src=x onerror=alert(1)>',
  '<iframe src=javascript:alert(1)>',
  '<iframe srcdoc="<script>alert(1)</script>">',
  '<object data=x.swf>',
  '<embed src=x>',
  '<form action=x><button>x</button></form>',
  '<form><input formaction=javascript:alert(1)>',
  '<style>*{x:expression(alert(1))}</style>',
  '<div style="background:url(javascript:alert(1))">x</div>',
  '<link rel=stylesheet href=x>',
  '<meta http-equiv=refresh content="0;url=javascript:alert(1)">',
  '<base href=javascript:alert(1)//>',
  '<template><img src=x onerror=alert(1)></template>',
  '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
  '<noembed><img title="</noembed><img src onerror=alert(1)>">',
  '<textarea><img src=x onerror=alert(1)></textarea>',
  '<title><img src=x onerror=alert(1)></title>',
  '<xmp><img src=x onerror=alert(1)></xmp>',
  '<plaintext><img src=x onerror=alert(1)>',
  '<!--<img src=x onerror=alert(1)>-->',
  '<!-- --!><img src=x onerror=alert(1)> -->',
  '<!--><img src=x onerror=alert(1)>-->',
  '<![CDATA[><img src=x onerror=alert(1)>]]>',
  '<?xml ?><img src=x onerror=alert(1)>',
  '<!DOCTYPE x><img src=x onerror=alert(1)>',
  '</p><img src=x onerror=alert(1)>',
  '<a/href=x/onclick=alert(1)>x</a>',
  '<img\nsrc=x\nonerror=alert(1)>',
  '<img src=x onerror\t=alert(1)>',
  '<img src="x"onerror="alert(1)">',
  '<p title="a\'b" onclick=x>q</p>',
  "<p title='a\"b' onclick=x>q</p>",
  '<p title=a"b onclick=x>q</p>',
  // URL schemes, markdown and HTML
  `[x](${J}:alert(1))`,
  `[x](${J.toUpperCase()}:alert(1))`,
  `[x]( ${J}:alert(1))`,
  `[x](<${J}:alert(1)>)`,
  '[x](java\tscript:alert(1))',
  `[x](${J}&colon;alert(1))`,
  `[x](${J}&#58;alert(1))`,
  `[x](${J}&#x3A;alert(1))`,
  '[x](&#106;avascript:alert(1))',
  '[x](j&#x61;vascript:alert(1))',
  `[x](${J}&#0058alert(1))`,
  '[x](jav&Tab;ascript:alert(1))',
  '[x](jav&NewLine;ascript:alert(1))',
  '[x](%6a%61vascript:alert(1))',
  `[x](\\${J}:alert(1))`,
  `[x](${J}\\:alert(1))`,
  '[x](data:text/html,<script>alert(1)</script>)',
  '[x](vbscript:msgbox(1))',
  `<${J}:alert(1)>`,
  `[x][r]\n\n[r]: ${J}:alert(1)`,
  `[x][r]\n\n[r]: <${J}&colon;alert(1)>`,
  `![x](${J}:alert(1))`,
  '![x](data:image/svg+xml,<svg onload=alert(1)>)',
  `<a href="${J}:alert(1)">x</a>`,
  `<a href="  ${J}:alert(1)">x</a>`,
  `<a href="jav&#x09;ascript:alert(1)">x</a>`,
  `<a href="jav&#9;ascript:alert(1)">x</a>`,
  `<a href="${J}&colon;alert(1)">x</a>`,
  `<a href="${J}&#58alert(1)">x</a>`,
  `<a href="&#x6A;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3A;alert(1)">x</a>`,
  `<a href=${J}:alert(1)>x</a>`,
  `<a href='${J}:alert(1)'>x</a>`,
  `<a href="\x01${J}:alert(1)">x</a>`,
  `<a href="${J}\x00:alert(1)">x</a>`,
  `<a href="https://ok" href="${J}:alert(1)">x</a>`,
  `<a href="${J}:alert(1)" href="https://ok">x</a>`,
  `<q cite="${J}:x">q</q>`,
  `<img src="${J}:alert(1)">`,
  `<img longdesc="${J}:alert(1)">`,
  `<source srcset="${J}:alert(1)">`,
  `<a href="https://x.com&#x22; onclick=&#x22;alert(1)">x</a>`,
  // container escape and structure
  '</div><img src=x onerror=alert(1)>',
  '</div></div></div><script>alert(1)</script>',
  '<div>a</span></div></div>b',
  '</body></html><script>alert(1)</script>',
  '<table><td>x</td></table></div>',
  '<td>x</td><tr>y</tr>',
  '| a |\n|---|\n| <tr><td>x</td></tr> |',
  '<table><tr><td><table><tr><td>x</div></td></tr></table>',
  '<table><img src=x onerror=alert(1)></table>',
  '<table><div>x</div></table>',
  '<select><img src=x onerror=alert(1)></select>',
  '<p><div>x</div></p>',
  '<a><a>x</a></a>',
  '<li>a<li>b',
  '<dl><dt>a<dd>b</dl>',
  '<b><p>x</b></p>',
  '<pre>\n\n</pre>',
  '<details><summary>**x**</summary>\n\n</div>\n\n</details>',
  // inline markdown inside raw HTML, the marker, alerts, footnotes, code
  '<p>`<img src=x onerror=alert(1)>`</p>',
  '<p>*a* &lt;img src=x onerror=alert(1)&gt;</p>',
  `<p>[x](${J}:alert(1))</p>`,
  `<td>[x](${J}:alert(1))</td>`,
  '<p>￿#x3C;img src=x onerror=alert(1)></p>',
  '￿#60;script>alert(1)￿#60;/script>',
  '[x](￿colon;)',
  `[x](${J}￿colon;alert(1))`,
  '| ￿#60;img |\n|---|',
  '```￿"onclick=x\nx\n```',
  '```"><img src=x onerror=alert(1)>\nx\n```',
  '``` x" onclick="alert(1)\ncode\n```',
  '> [!NOTE]\n> <img src=x onerror=alert(1)>',
  `> [!NOTE]\n> [x](${J}:alert(1))`,
  `x[^1]\n\n[^1]: [y](${J}:alert(1)) <script>alert(1)</script>`,
  '[^"><img src=x onerror=alert(1)>]: x\n\n[^"><img src=x onerror=alert(1)>]',
  '- [x] <img src=x onerror=alert(1)>',
  '`<script>alert(1)</script>`',
  '    <script>alert(1)</script>',
  'Integer numbers<script>',
  '<a href="https://x" rel="opener" target="_self">x</a>',
  '<div class="x" id="y" name="z" data-x="1" itemscope>x</div>',
  '<input type=text value=x>',
  '<input type=checkbox checked>',
]
const fails = vectors.flatMap(check)
console.log('vectors:', vectors.length, 'failing:', fails.length)
for (const f of fails) console.log(JSON.stringify(f.md), '\n  ->', JSON.stringify(f.out), '\n  ', f.errs ?? f.err)

// Random fuzz from a bag of dangerous and structural fragments.
const BAG = [
  '<table>',
  '<tr>',
  '<td>',
  '</td>',
  '</table>',
  '| x | y |\n|---|---|\n| ',
  '<source srcset="',
  '<picture>',
  '<ul><li>',
  '<dl><dt>',
  '<select>',
  '<option>',
  '<object>',
  '</form>',
  '</script>',
  '</style>',
  '</noscript>',
  '</textarea>',
  '<svg><p>',
  '<math><mtext>',
  '<table><caption>',
  '<frameset>',
  '<isindex>',
  '<image src=x onerror=1>',
  '<',
  '>',
  '</',
  '/>',
  '"',
  "'",
  '=',
  ' ',
  '\n',
  '\n\n',
  '\t',
  '`',
  '```',
  '*',
  '_',
  '~',
  '[',
  ']',
  '(',
  ')',
  '!',
  '|',
  '\\',
  '&',
  ';',
  '#',
  ':',
  '-',
  '>',
  'script',
  'img',
  'a',
  'p',
  'div',
  'td',
  'table',
  'details',
  'summary',
  'svg',
  'math',
  'style',
  'noscript',
  'textarea',
  'template',
  'form',
  'iframe',
  'li',
  'code',
  'pre',
  ' src=x',
  ' onerror=alert(1)',
  ' href=',
  J + ':',
  'java',
  'script:',
  '&colon;',
  '&#58;',
  '&#x3a;',
  '&Tab;',
  '&#9;',
  '&#x09',
  '&lt;',
  '&amp;',
  '￿',
  '<!--',
  '-->',
  '<!',
  ']]>',
  '<![CDATA[',
  '[x](',
  '[x]: ',
  '<https://',
  '> [!NOTE]\n> ',
  '[^1]',
  '[^1]: ',
  '- [x] ',
  '| a |\n|---|\n',
  'www.x.com',
  'a@b.co',
  '<p>',
  '</p>',
  '<a href="',
  '<img src=',
  '</div>',
  '<b>',
  '</b>',
]
let seed = 12345
const rnd = (n) => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed % n
}
const N = Number(process.argv[2] ?? 300000)
const fuzzFails = []
const t0 = Date.now()
for (let i = 0; i < N; i++) {
  let s = ''
  for (let k = 1 + rnd(14); k > 0; k--) s += BAG[rnd(BAG.length)]
  const f = check(s)
  if (f.length) fuzzFails.push(...f)
}
const byKind = {}
for (const f of fuzzFails)
  for (const e of f.errs ?? [f.err]) {
    const k = e.replace(/[:=].*$/, '').replace(/ \S+$/, '')
    ;(byKind[k] ??= []).push(f)
  }
console.log(`\nfuzz: ${N} inputs in ${((Date.now() - t0) / 1000).toFixed(0)}s, failing: ${fuzzFails.length}`)
for (const [k, list] of Object.entries(byKind)) {
  console.log(`  ${k}: ${list.length}`)
  if (k !== 'restructured') {
    for (const f of list.slice(0, 3)) console.log('     ', JSON.stringify(f.md), '->', JSON.stringify(f.out), f.errs)
    continue
  }
  // Group restructurings by what the browser changed.
  const sig = {}
  for (const f of list) {
    const e = f.errs.find((x) => x.startsWith('restructured'))
    const [a, b] = e.slice(14).split(' -> ')
    const A = a.split(','),
      B = b.split(',')
    const added = B.filter((t) => !A.includes(t))
    const key = added.length
      ? 'inserts ' + [...new Set(added)].join('/')
      : A.length !== B.length
        ? 'duplicates (adoption agency)'
        : 'reorders (foster parenting / misnesting)'
    ;(sig[key] ??= []).push(f)
  }
  for (const [s, l] of Object.entries(sig).sort((x, y) => y[1].length - x[1].length))
    console.log(`     ${s}: ${l.length}   e.g. ${JSON.stringify(l[0].md)} -> ${JSON.stringify(l[0].out)}`)
}
