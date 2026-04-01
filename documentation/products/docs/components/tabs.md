# Tabs

Tabs create interactive tabbed interfaces that organize content into multiple panels. They're perfect for displaying different versions of code, multiple examples, or organizing related content into logical sections. Each tab has a clickable header and contains its own content area.

## Properties

Properties outside of `id`, `title`, and `default` will be ignored, however they can be useful. In the example below some ignored properties have been added to aid with reability, eg. `javascript-end`.

### id
`string` _required_

A unique identifier for the tab. This is automatically generated from the title if not provided, using slugification.

### title
`string` _required_

The text displayed in the tab header. This is what users will see and click on to switch between tabs.

### default
`string` _optional_

The ID of the tab that should be active by default. If not specified, the first tab will be active.

## Examples

### Basic Tabs

<scalar-tabs outer>
<scalar-tab title="Custom HTML" customHtml>
<!--The actual tabs, rendered-->
<scalar-tabs nested>
  <scalar-tab title="JavaScript">
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
```
  </scalar-tab javascript-end>

  <scalar-tab title="TypeScript">
```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
```
  </scalar-tab typescript-end>

  <scalar-tab title="Python">
```python
def greet(name):
  return f"Hello, {name}!"

print(greet("World"))
```
  </scalar-tab python-end>
</scalar-tabs nested>

<!--The tabs as raw markdown for display -->
````markdown
<scalar-tabs nested>
  <scalar-tab title="JavaScript">
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
```
  </scalar-tab javascript-end>

  <scalar-tab title="TypeScript">
```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

console.log(greet('World'));
```
  </scalar-tab typescript-end>

  <scalar-tab title="Python">
```python
def greet(name):
  return f"Hello, {name}!"

print(greet("World"))
```
  </scalar-tab python-end>
</scalar-tabs nested>
````
</scalar-tab customHtml>

<scalar-tab title="Directive" directive>
<!--The actual tabs, rendered-->
::::scalar-tabs
:::scalar-tab{ title="Rust" }

```rust
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    println!("{}", greet("World"));
}
```
:::
:::scalar-tab{ title="Go" }

```go
package main

import (
    "fmt"
)

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func main() {
    fmt.Println(greet("World"))
}
```
:::
:::scalar-tab{ title="C++" }

```cpp
#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

int main() {
    std::cout << greet("World") << std::endl;
    return 0;
}
```
:::
::::

<!--The tabs as raw markdown for display -->
````markdown
::::scalar-tabs
:::scalar-tab{ title="Rust" }

```rust
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    println!("{}", greet("World"));
}
```
:::
:::scalar-tab{ title="Go" }

```go
package main

import (
    "fmt"
)

func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func main() {
    fmt.Println(greet("World"))
}
```
:::
:::scalar-tab{ title="C++" }

```cpp
#include <iostream>
#include <string>

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

int main() {
    std::cout << greet("World") << std::endl;
    return 0;
}
```
:::
::::
````
</scalar-tab directive>
</scalar-tabs outer>

### Tabs with Default Selection
<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-tabs default="TypeScript">
  <scalar-tab title="JavaScript">

  ```javascript
  const user = {
    name: "John",
    age: 30
  };
  ```
  </scalar-tab>
  
  <scalar-tab title="TypeScript">

  ```typescript
  interface User {
    name: string;
    age: number;
  }
  
  const user: User = {
    name: "John",
    age: 30
  };
  ```
  </scalar-tab>
</scalar-tabs>

````html
<scalar-tabs default="TypeScript">
  <scalar-tab title="JavaScript">

  ```javascript const user = { name: "John", age: 30 }; ```
  </scalar-tab>

  <scalar-tab title="TypeScript">

  ```typescript interface User { name: string; age: number; } const user: User
  = { name: "John", age: 30 }; ```
  </scalar-tab>
</scalar-tabs>
````
</scalar-tab>

<scalar-tab title="Directive">

::::scalar-tabs{ default="TypeScript" }
:::scalar-tab{ title="JavaScript" }

  ```javascript
  const user = {
    name: "John",
    age: 30
  };
  ```
::: 

:::scalar-tab{ title="TypeScript" }

  ```typescript
  interface User {
    name: string;
    age: number;
  }
  
  const user: User = {
    name: "John",
    age: 30
  };
  ```
:::
::::

````markdown
::::scalar-tabs{ default="TypeScript" }
:::scalar-tab{ title="JavaScript" }

  ```javascript
  const user = {
    name: "John",
    age: 30
  };
  ```
::: 

:::scalar-tab{ title="TypeScript" }

  ```typescript
  interface User {
    name: string;
    age: number;
  }
  
  const user: User = {
    name: "John",
    age: 30
  };
  ```
:::
::::
````
</scalar-tab>
</scalar-tabs>
</scalar-tabs>


### Tabs with Mixed Content

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-tabs>
  <scalar-tab title="Overview">
    This is the overview tab with plain text content.
    
    You can include **markdown** formatting and other elements.
  </scalar-tab>
  
  <scalar-tab title="Code Example">

  ```bash
  npm install @scalar/guide-elements
  ```

  This tab contains a code example with additional text.
  </scalar-tab>
  
  <scalar-tab title="Configuration">

  ```json
  {
    "theme": "dark",
    "interactive": true,
    "features": ["tabs", "steps", "callouts"]
  }
  ```
  </scalar-tab>
</scalar-tabs>

````html
<scalar-tabs>
  <scalar-tab title="Overview">
  This is the overview tab with plain text content. You can include
  **markdown** formatting and other elements.
  </scalar-tab>

  <scalar-tab title="Code Example">

  ```bash npm install @scalar/guide-elements```
  
  This tab contains a code example with additional text.
  </scalar-tab>

  <scalar-tab title="Configuration">

  ```json { "theme": "dark", "interactive": true, "features": ["tabs",
  "steps", "callouts"] }
  ```
  </scalar-tab>
</scalar-tabs>
````
</scalar-tab>

<scalar-tab title="Directive">

::::scalar-tabs
:::scalar-tab{ title="Overview" }
This is the overview tab with plain text content.

You can include **markdown** formatting and other elements.
:::

:::scalar-tab{ title="Code Example" }

```bash
npm install @scalar/guide-elements
```

This tab contains a code example with additional text.
:::

:::scalar-tab{ title="Configuration" }

```json
{
  "theme": "dark",
  "interactive": true,
  "features": ["tabs", "steps", "callouts"]
}
```
:::
::::

````html
::::scalar-tabs
:::scalar-tab{ title="Overview" }
This is the overview tab with plain text content.

You can include **markdown** formatting and other elements.
:::

:::scalar-tab{ title="Code Example" }

```bash
npm install @scalar/guide-elements
```

This tab contains a code example with additional text.
:::

:::scalar-tab{ title="Configuration" }

```json
{
  "theme": "dark",
  "interactive": true,
  "features": ["tabs", "steps", "callouts"]
}
```
:::
::::
````

</scalar-tab>
</scalar-tabs>

