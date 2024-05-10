# Scalar Play Button

Have your own custom docs and want API testing built in? Check out our new release Scalar ▶️ Button which brings up Scalar's simple API Client for you to play around with an endpoint right away

## Installation and Usage

Add the Scalar Play Button to your page

```
    <script
      id="scalar-play-button-script"
      data-url="https://petstore3.swagger.io/api/v3/openapi.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/play-button"></script>
```

then add a button with the class and optional scalar-operation-id

```
    <button
      scalar-operation-id="getPetById"
      class="scalar-play-button">Try it Out</button>

```

Now when that button is clicked the Scalar API Client will open up :)
