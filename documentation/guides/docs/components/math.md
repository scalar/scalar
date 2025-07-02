# Math

Math elements render mathematical equations using LaTeX syntax with KaTeX rendering. They're perfect for displaying complex mathematical formulas, equations, and expressions in a clean, professional format. Each math element can include an optional caption for better context and accessibility.

## Properties

### equation
`string` _required_

The LaTeX equation to render. This should contain valid LaTeX mathematical notation that KaTeX can parse and display.

### caption 
`string` _optional_

A descriptive caption for the equation. This appears below the rendered math and provides context or explanation for the mathematical expression.

## Examples

### Basic Math Equation

<scalar-math equation="x^2 + y^2 = z^2">
</scalar-math>

```html
<scalar-math equation="x^2 + y^2 = z^2"> </scalar-math>
```

### Math with Caption

<scalar-math 
  equation="E = mc^2"
  caption="Einstein's mass-energy equivalence">
</scalar-math>

```html
<scalar-math
  equation="E = mc^2"
  caption="Einstein's mass-energy equivalence">
</scalar-math>
```

### Complex Mathematical Expression

<scalar-math 
  equation="\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}"
  caption="Gaussian integral">
</scalar-math>

```html
<scalar-math
  equation="\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}"
  caption="Gaussian integral">
</scalar-math>
```

### Matrix Equation

<scalar-math 
  equation="\begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} e \\ f \end{pmatrix}"
  caption="System of linear equations in matrix form">
</scalar-math>

```html
<scalar-math
  equation="\begin{pmatrix} a & b \\ c & d \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} = \begin{pmatrix} e \\ f \end{pmatrix}"
  caption="System of linear equations in matrix form">
</scalar-math>
```
