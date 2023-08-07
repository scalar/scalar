<script lang="ts" setup>
import { Card, CardContent, CardHeader } from '../Card'
</script>
<template>
  <div class="reference-container">
    <div class="copy">
      <div class="editor-heading-kOKzMzHkcd">
        <h1 class="heading">Swagger Petstore - OpenAPI 3.0</h1>
      </div>
      <p class="tag-description"></p>
    </div>
    <div>
      <Card>
        <CardHeader muted>Base URL</CardHeader>
        <CardContent muted>
          <BaseUrl url="https://petstore3.swagger.io/api/v3" />
        </CardContent>
      </Card>
    </div>
  </div>
</template>
