# Steps

Steps create interactive, collapsible sections that are perfect for tutorials, guides, and step-by-step instructions. They can be used individually or grouped together in a steps container. Each step can be interactive (collapsible) or static, and includes a visual marker with an optional title.

## Properties

### id
`string` _required_

A unique identifier for the step. This is used internally for step management and accessibility.

### title
`string` _optional_

The title displayed in the step header. This appears next to the step marker and provides a brief description of the step.

### interactivity
`string` _optional_

Controls whether the step is interactive (collapsible) or static:

- `"none"`: Makes the step static (non-collapsible)
- Any other value or omitted: Makes the step interactive (collapsible)

### icon
`string` _optional_

A custom icon to display in the step marker. Uses Scalar icon format. If not provided, the component will use the default step marker icon.

### childIndex
`number` _optional_

The position of this step within a steps container. Used internally for step ordering and navigation.

## Examples

### Basic Step

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-step id="step-1" title="Install Dependencies">
First, install the required dependencies by running:
  
```bash
npm install @scalar/guide-elements
```
</scalar-step>

````html
<scalar-step id="step-1" title="Install Dependencies">
First, install the required dependencies by running:
  
```bash
npm install @scalar/guide-elements
```
</scalar-step>
````
</scalar-tab>

<scalar-tab title="Directive">

:::scalar-step{ id="step-1" title="Install Dependencies"}
First, install the required dependencies by running:
  
```bash
npm install @scalar/guide-elements
```
:::

````markdown
:::scalar-step{ id="step-1" title="Install Dependencies"}
First, install the required dependencies by running:

```bash
npm install @scalar/guide-elements
```
:::
````
</scalar-tab>
</scalar-tabs>

### Static Step (Non-collapsible)

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-step 
  id="step-2" 
  title="Configuration" 
  interactivity="none">
This step cannot be collapsed and is always visible.

```javascript
const config = {
  theme: 'dark',
  interactive: false,
}
```

</scalar-step>

````html
<scalar-step 
  id="step-2" 
  title="Configuration" 
  interactivity="none">
This step cannot be collapsed and is always visible.

```javascript
const config = {
  theme: 'dark',
  interactive: false,
}
```

</scalar-step>
````

</scalar-tab>

<scalar-tab title="Directive">

:::scalar-step{ id="step-2" title="Configuration" interactivity="none" }
This step cannot be collapsed and is always visible.

```javascript
const config = {
  theme: 'dark',
  interactive: false,
}
```
:::

````markdown
::scalar-step{ id="step-2" title="Configuration" interactivity="none" }
This step cannot be collapsed and is always visible.

```javascript
const config = {
  theme: 'dark',
  interactive: false,
}
```
:::
````
</scalar-tab>
</scalar-tabs>

### Steps Container

<scalar-tabs>
<scalar-tab title="Custom HTML">

<scalar-steps>
  <scalar-step id="step-1" title="Setup Project">
Initialize a new project:

```bash
mkdir my-project
cd my-project
npm init -y
```
  </scalar-step>
  
  <scalar-step id="step-2" title="Install Dependencies">
Install the required packages:

```bash
npm install react react-dom
```
  </scalar-step>

  <scalar-step id="step-3" title="Start Development">
Begin development:

```bash
npm start
```
  </scalar-step>
</scalar-steps>

````html
<scalar-steps>
  <scalar-step id="step-1" title="Setup Project">
Initialize a new project:

```bash
mkdir my-project
cd my-project
npm init -y
```
  </scalar-step>
  
  <scalar-step id="step-2" title="Install Dependencies">
Install the required packages:

```bash
npm install react react-dom
```
  </scalar-step>
  
  <scalar-step id="step-3" title="Start Development">
Begin development:

```bash
npm start
```
  </scalar-step>
</scalar-steps>
````

</scalar-tab>

<scalar-tab title="Directive">

::::scalar-steps
:::scalar-step{ id="step-1" title="Setup Project" }
Initialize a new project:
```bash
mkdir my-project
cd my-project
npm init -y
```
:::  

:::scalar-step{ id="step-2" title="Install Dependencies" }
Install the required packages:
```bash
npm install react react-dom
```
:::

:::scalar-step{ id="step-3" title="Start Development" }
Begin development:

```bash
npm start
```
:::
::::

````markdown
::::scalar-steps
:::scalar-step{ id="step-1" title="Setup Project" }
Initialize a new project:
```bash
mkdir my-project
cd my-project
npm init -y
```
:::  

:::scalar-step{ id="step-2" title="Install Dependencies" }
Install the required packages:
```bash
npm install react react-dom
```
:::

:::scalar-step{ id="step-3" title="Start Development" }
Begin development:

```bash
npm start
```
:::
::::
````
</scalar-tab>
</scalar-tabs>
