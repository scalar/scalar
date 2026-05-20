export default /* md */ `
Codeblock via indent

    tell application "Foo"
        beep
    end tell

---

Codeblock via backticks

\`\`\`javascript
const message = 'this is a code block'

console.log(message)
\`\`\`

---

Codeblock with HTML

\`\`\`html
<div class="footer">&copy; 2004 Foo Corporation</div>
\`\`\`

---

Codeblock with markdown


\`\`\`md
# Title

I should not be **bold**.
\`\`\`
`
