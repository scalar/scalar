<!-- section: ATX headings -->

# Heading 1

## Heading 2 with **bold**, `code` and a [link](https://example.com)

### Heading 3 ###

#### Heading 4

##### Heading 5

###### Heading 6

####### Not a heading

#Not a heading either

<!-- section: Setext headings -->

Setext heading 1
================

Setext heading 2
----------------

<!-- section: Heading text for slugs -->

## Café &amp; crème: _the_ "guide"

## Same heading

## Same heading

<!-- section: Paragraphs and line breaks -->

A paragraph with a soft
line break.

A hard break with two spaces  
and with a backslash\
and a third line.

   Indented up to three spaces is still a paragraph.

Trailing spaces at the end are dropped.   

<!-- section: Emphasis -->

*emphasis*, _emphasis_, **strong**, __strong__, ***both***, **_nested_ strong**, *__nested__ emphasis*

snake_case_words stay intact, but intra*word*emphasis works with stars.

**unclosed strong, *unclosed emphasis, and a lone * star.

<!-- section: Code spans -->

Use `inline code`, ``code with ` a backtick``, ` `` `, and `  padded  `.

A `code span
over two lines`.

<!-- section: Escapes and entities -->

\*not emphasis\* \_not emphasis\_ \`not code\` \# not a heading \[not a link\] \\ backslash

&amp; &lt; &gt; &quot; &copy; &nbsp;x &mdash; &hellip; &eacute; &frac34; &ThickSpace;x &#35; &#x1F600; &bogus; & AT&T

<!-- section: Links -->

[inline](https://example.com), [with title](https://example.com "Title"), [relative](/docs/intro), [anchor](#section), [angle brackets](<https://example.com/a b>), [mailto](mailto:hello@example.com), [empty]().

[full reference][ref], [collapsed reference][], [shortcut reference], [case insensitive][REF].

<https://example.com/autolink> and <hello@example.com>

[ref]: https://example.com/reference "Reference title"
[collapsed reference]: https://example.com/collapsed
[shortcut reference]: /shortcut

<!-- section: Images -->

![Alt text](https://example.com/image.png "Image title") and ![reference image][logo]

[![Linked image](https://example.com/badge.svg)](https://example.com)

[logo]: https://example.com/logo.png

<!-- section: Blockquotes -->

> A blockquote
> with two lines.
>
> > A nested blockquote.
>
> - A list in a blockquote
>
> ```json
> { "inside": "a blockquote" }
> ```

> Lazy
continuation line.

<!-- section: Unordered lists -->

- Dash
- Items

* Star
* Items

+ Plus
+ Items

- Nested
  - Second level
    - Third level
      - Fourth level

<!-- section: Ordered lists -->

1. One
2. Two
3. Three

3. Starting at three
4. Four

1) Parenthesis
2) Delimiters

<!-- section: Loose lists -->

- Loose item one

- Loose item two

  With a second paragraph.

- Loose item three

<!-- section: List items with blocks -->

1. A list item with code:

       indented code in a list

2. A list item with a fence:

   ```bash
   curl https://example.com
   ```

3. A list item with a quote:

   > Quoted

<!-- section: Task lists -->

- [ ] Unchecked
- [x] Checked
- [X] Checked with a capital
- [ ] With **formatting** and a [link](https://example.com)
  - [ ] Nested task
- Not a task

<!-- section: Indented code -->

    tell application "Foo"
        beep
    end tell

<!-- section: Fenced code -->

```javascript
const message = 'this is a code block'

console.log(message)
```

~~~python title="example.py"
def hello():
    return "tilde fence with meta"
~~~

```
no language
```

````md
```
a fence inside a fence
```
````

```html
<div class="footer">&copy; 2004 Foo Corporation</div>
```

<!-- section: Thematic breaks -->

***

---

___

- - -

<!-- section: Tables -->

| Left | Center | Right | Default |
| :--- | :----: | ----: | ------- |
| `code` | **bold** | [link](https://example.com) | plain |
| pipe \| escaped | `a \| b` | | missing cells |
| extra | cells | are | dropped | here |

A paragraph before a table
| Interrupts | Paragraph |
| --- | --- |
| yes | it does |

Header only | table
--- | ---

<!-- section: Strikethrough -->

~~two tildes~~ and ~one tilde~ and ~~~three is not~~~.

<!-- section: Autolink literals -->

Visit www.example.com, https://example.com/path?query=1&b=2. Or (https://example.com/in-parens) and email hello@example.com.

A trailing dot https://example.com. and a trailing paren https://en.wikipedia.org/wiki/Markdown_(disambiguation)).

<!-- section: Footnotes -->

A footnote[^1], a named one[^note], and the first one again[^1].

[^1]: The first footnote.

[^note]: A longer footnote.

    With a second paragraph.

<!-- section: Alerts -->

> [!NOTE]
> Highlights information that users should take into account, even when skimming.

> [!TIP]
> Optional information to help a user be more successful.

> [!IMPORTANT]
> Crucial information necessary for users to succeed.

> [!WARNING]
> Critical content demanding immediate user attention due to potential risks.

> [!CAUTION]
> Negative potential consequences of an action.

> [!SUCCESS]
> Scalar's own alert type.

<!-- section: Alert variants -->

> [!note]
> Lowercase type.

> [!WARNING] Text on the same line as the marker.

> [!TIP]  
> Marker followed by a hard break.

> [!IMPORTANT]
> A **formatted** alert with `code` and a [link](https://example.com).

> [!UNKNOWN]
> Not an alert type, so it stays a blockquote.

> Not an alert
> [!NOTE] because the marker is not first.

- > [!NOTE]
  > Not at the root, so it stays a blockquote.

<!-- section: Raw HTML blocks -->

<div class="custom-class" id="custom-id">
  A <span class="highlight">div</span> with classes.
</div>

<dl>
  <dt>Beast of Bodmin</dt>
  <dd>A large feline inhabiting Bodmin Moor.</dd>
</dl>

<table>
  <thead><tr><th>HTML</th><th>table</th></tr></thead>
  <tbody><tr><td>cell</td><td>cell</td></tr></tbody>
</table>

<!-- An HTML comment -->

<hr>

<!-- section: Inline HTML -->

Press <kbd>Ctrl</kbd> + <kbd>C</kbd>. H<sub>2</sub>O and E = mc<sup>2</sup>. <b>bold</b> <i>italic</i> <s>struck</s> <del>deleted</del> <ins>inserted</ins> <q>quoted</q> <var>x</var> <samp>output</samp> <tt>teletype</tt> <span>span</span>.<br>After a break.

<!-- section: Inline Markdown inside HTML tags -->

<p>`code` and **bold** inside a raw paragraph</p>

<ul>
  <li>`code` in a list item</li>
  <li>*emphasis* in a list item</li>
</ul>

<table>
  <tr><th>**Header**</th></tr>
  <tr><td>`cell code`</td></tr>
</table>

<dl>
  <dt>**Term**</dt>
  <dd>`definition`</dd>
</dl>

<p>Use &lt;span&gt; with `className`</p>

<div>`not parsed` inside a div</div>

<!-- section: Details -->

<details>
  <summary>Using Details Tags</summary>
  <p>HTML Example</p>
</details>

<details>
<summary>Summary</summary>

Markdown *inside* details, after a blank line.

- With a list

</details>

<details open>
  <summary>Open by default</summary>
  Content
</details>

<!-- section: External links -->

[Markdown external](https://example.com), [Markdown relative](/relative), [Markdown http](http://example.com).

<a href="https://example.com">HTML external</a>, <a href="/relative">HTML relative</a>, <a href="#anchor">HTML anchor</a>.

<!-- section: Sanitizing -->

<script>alert('script')</script>

<style>body { display: none; }</style>

<iframe src="https://example.com"></iframe>After an iframe.

<object data="x.swf"></object>
<embed src="x.swf">
<form action="https://example.com"><button>Submit</button></form>

<div onclick="alert(1)" style="color: red" data-x="1">Event handler, style and data attributes removed</div>

<a href="javascript:alert(1)">javascript: link</a> [Markdown javascript: link](javascript:alert(1)) <a href="https://example.com" rel="opener">rel replaced</a>

<img src="x" onerror="alert(1)"> <input type="text" value="becomes a disabled checkbox">

<a class="not-allowed-on-links">link class</a> <code class="language-js other">code class</code>

<font color="red">font</font> <center>center</center> <u>underline</u> <mark>mark</mark> <abbr title="Abbreviation">abbr</abbr>

<!-- section: Tag filter -->

<textarea>textarea</textarea>

<title>title</title>

<noscript>noscript</noscript>

<xmp>xmp</xmp>

<!-- section: Mixed document -->

# Introduction

Welcome to the **API**. See [the guide](https://example.com/guide) or jump to [authentication](#authentication).

## Authentication

> [!WARNING]
> Keep your `API_KEY` secret.

1. Create a key in the dashboard.
2. Send it as a header:

   ```bash
   curl -H "Authorization: Bearer $API_KEY" https://api.example.com/v1/planets
   ```

3. Check the response:

   | Status | Meaning |
   | ---: | --- |
   | `200` | OK |
   | `401` | Missing or invalid key |

## Rate limits

- 100 requests per minute
- [x] Retries with backoff
- See <https://example.com/limits>[^limits]

[^limits]: Limits are per key.

<!-- section: Known difference: raw link with a target attribute -->

Read the <a href="https://example.com/guide" target="_blank">integration guide</a> first.

<!-- section: Known difference: details with Markdown in the summary -->

<details>
<summary>**Bold** summary</summary>

Body text after a blank line.

</details>

<!-- section: Known difference: alert followed by a list -->

> [!NOTE]
> - First point
> - Second point

<!-- section: Known difference: raw paragraph with a Markdown marker -->

<p>Creates a new <code>OnboardingLink</code> object with a redirect_url.</p>
