# Tabs

Tabs create interactive tabbed interfaces that organize content into multiple panels. They're perfect for displaying different versions of code, multiple examples, or organizing related content into logical sections. Each tab has a clickable header and contains its own content area.

## Properties

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

<scalar-tabs>
  <scalar-tab title="JavaScript">

  ```javascript
  function greet(name) {
    return `Hello, ${name}!`;
  }
  
  console.log(greet('World'));
  ```
  </scalar-tab>
  
  <scalar-tab title="TypeScript">

  ```typescript
  function greet(name: string): string {
    return `Hello, ${name}!`;
  }
  
  console.log(greet('World'));
  ```
  </scalar-tab>
  
  <scalar-tab title="Python">

  ```python
  def greet(name):
      return f"Hello, {name}!"
  
  print(greet("World"))
  ```
  </scalar-tab>
</scalar-tabs>

````html
<scalar-tabs>
  <scalar-tab title="JavaScript">

  ```javascript function greet(name) { return `Hello, ${name}!`; }
  console.log(greet('World')); ```
  </scalar-tab>

  <scalar-tab title="TypeScript">

  ```typescript function greet(name: string): string { return `Hello,
  ${name}!`; } console.log(greet('World')); ```
  </scalar-tab>

  <scalar-tab title="Python">

  ```python def greet(name): return f"Hello, {name}!" print(greet("World"))
  ```
  </scalar-tab>
</scalar-tabs>
````

### Tabs with Default Selection

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

### Tabs with Mixed Content

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
