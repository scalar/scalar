package main

import (
	"example/gofiber/docs"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/swaggo/swag"
	"github.com/yokeTH/gofiber-scalar/scalar"
)

// hello godoc
//
//	@summary		hello
//	@success 		200
//
// @Router / [get]
func handler(c *fiber.Ctx) error {
	return c.SendString("Hello, World 👋!")
}

func main() {
	app := fiber.New()

	app.Get("/", handler)

	swag.Register(docs.SwaggerInfo.InstanceName(), docs.SwaggerInfo)
	app.Use(scalar.New())

	log.Fatal(app.Listen(":3000"))
}
