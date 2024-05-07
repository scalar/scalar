# Golang proxy

## Installation

Ensure you have golang installed
https://go.dev/

# Run

```
go run main.go
```

```
2024/03/29 21:51:54 Starting proxy server on :1337
```

Test it out!

```
curl --request GET \
  --url 'localhost:1337?=&url=https%3A%2F%2Fpetstore3.swagger.io%2Fapi%2Fv3%2Fpet%2F10'
```

```
{"id":10,"category":{"id":1,"name":"Dogs"},"name":"doggie","photoUrls":["string"],"tags":[{"id":0,"name":"string"}],"status":"string"}
```

# no mod file?

just using the standard library! so we dont need a mod file :)
