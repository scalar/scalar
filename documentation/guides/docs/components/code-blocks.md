# Code Blocks

Code blocks are syntax-highlighted containers for displaying code snippets. They provide a clean, readable way to showcase code examples with language-specific highlighting and copy functionality. Each code block includes a language indicator and a copy button for easy code sharing.

## Properties

### lang
`string` _required_

The programming language for syntax highlighting. Common values include `javascript`, `typescript`, `python`, `html`, `css`, `json`, etc. If not specified, defaults to `plaintext`.


## Examples

### Basic Code Block

<scalar-code lang="javascript">
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
</scalar-code>

```html
<scalar-code lang="javascript">
  function greet(name) { return `Hello, ${name}!`; }
  console.log(greet('World'));
</scalar-code>
```

### Code Block with Different Language

<scalar-code lang="python">
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
</scalar-code>

```html
<scalar-code lang="python">
  def fibonacci(n): if n <= 1: return n return fibonacci(n-1) + fibonacci(n-2)
  print(fibonacci(10))
</scalar-code>
```
