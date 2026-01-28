# Markdown Support

We support all standard Markdown features (actually, we're using GitHub-flavored Markdown).

## Headings

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

## Text Formatting

**Bold text**

*Italic text*

~~Strikethrough text~~

`Inline code`


```markdown
**Bold text**

*Italic text*

~~Strikethrough text~~

`Inline code`
```

## Lists

- Unordered list item
- Another item
  - Nested item
  - Another nested item

```markdown
- Unordered list item
- Another item
  - Nested item
  - Another nested item
```

1. Ordered list item
2. Another item
   1. Nested item
   2. Another nested item

```markdown
1. Ordered list item
2. Another item
   1. Nested item
   2. Another nested item
```

## Links and Images

```markdown
[Absolute URLs](https://example.com)
[Relative link](../another-markdown-file.md)
![Image](https://example.com/image.png)
```

## Code Blocks

````markdown
```javascript
function example() {
  return "Hello, World!";
}
```
````

```javascript
function example() {
  return "Hello, World!";
}
```

## Blockquotes

> This is a blockquote
>
> It can span multiple lines

```markdown
> This is a blockquote
>
> It can span multiple lines
```

## Tables
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

```markdown
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

## Task Lists

```markdown
- [x] Completed task
- [ ] Pending task
- [ ] Another pending task
```

## Hints

We support GitHub-style alerts for highlighting important information:

> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.

```markdown
> [!NOTE]
> Useful information that users should know, even when skimming content.

> [!TIP]
> Helpful advice for doing things better or more easily.

> [!IMPORTANT]
> Key information users need to know to achieve their goal.

> [!WARNING]
> Urgent info that needs immediate user attention to avoid problems.

> [!CAUTION]
> Advises about risks or negative outcomes of certain actions.
```

