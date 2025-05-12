# Gofiber Example
1. write the openapi comment above of handler function
  ``` go
  // hello godoc
  //
  //	@summary		hello
  //	@success 		200
  //
  // @Router / [get]
  func handler(c *fiber.Ctx) error {
  	return c.SendString("Hello, World 👋!")
  }
  ```
2. install the swaggo command
    ```bash
    go get github.com/yokeTH/gofiber-scalar/scalar
    ```
3. generate the document
  ```bash
  swag init -v3.1 # swag init --v3.1 for window
  ```
4. import docs and init the register swag
  ```go
  swag.Register(docs.SwaggerInfo.InstanceName(), docs.SwaggerInfo)
  ```
And use the middleware
  ```go
  app.Use(scalar.New())
  ```

More information at [gofiber-scalar](https://github.com/yokeTH/gofiber-scalar)
