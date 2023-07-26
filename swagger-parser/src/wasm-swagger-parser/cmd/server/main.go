package main

import (
	"fmt"
	"net/http"

	"github.com/NYTimes/gziphandler"
)

func main() {
	withGz := gziphandler.GzipHandler(http.FileServer(http.Dir("../../assets")))

	err := http.ListenAndServe(":9090", withGz)
	if err != nil {
		fmt.Println("Failed to start server", err)
		return
	}
}
