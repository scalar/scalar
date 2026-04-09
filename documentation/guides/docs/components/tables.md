# Tables

Tables let you organize structured data into rows and columns using standard GitHub-flavored Markdown syntax.

If you are looking for a dedicated `<Table />` MDX component, there is not one. Use regular Markdown tables instead.

## Basic Table

| Feature               | Status       | Notes                                          |
| --------------------- | ------------ | ---------------------------------------------- |
| Markdown tables       | Supported    | Works in all docs pages                        |
| Inline formatting     | Supported    | Links, inline code, and emphasis work in cells |
| Sorting and filtering | Not built in | Use static content or custom HTML/JS if needed |

```markdown
| Feature               | Status       | Notes                                          |
| --------------------- | ------------ | ---------------------------------------------- |
| Markdown tables       | Supported    | Works in all docs pages                        |
| Inline formatting     | Supported    | Links, inline code, and emphasis work in cells |
| Sorting and filtering | Not built in | Use static content or custom HTML/JS if needed |
```

## Column Alignment

Use colons in the separator row to align each column.

| Left   |  Center  |   Right |
| :----- | :------: | ------: |
| `:---` | `:----:` |  `---:` |
| Alpha  |  Bravo   | Charlie |

```markdown
| Left   |  Center  |   Right |
| :----- | :------: | ------: |
| `:---` | `:----:` |  `---:` |
| Alpha  |  Bravo   | Charlie |
```

## Escaping Pipe Characters

If your cell content includes `|`, escape it with `\|`.

| Expression    | Result      |
| ------------- | ----------- |
| `A \| B`      | A \| B      |
| `1 \| 2 \| 3` | 1 \| 2 \| 3 |

```markdown
| Expression    | Result      |
| ------------- | ----------- |
| `A \| B`      | A \| B      |
| `1 \| 2 \| 3` | 1 \| 2 \| 3 |
```
