import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { AppModule } from './app.module'

const PORT = Number(process.env.PORT) || 5057
const HOST = process.env.HOST || '0.0.0.0'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter())

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build()
  const document = SwaggerModule.createDocument(app, config)

  app.use(
    '/',
    apiReference({
      withFastify: true,
      content: document,
    }),
  )

  await app.listen(PORT, HOST, () => {
    console.log(`🦁 NestJS listening at http://${HOST}:${PORT}/reference`)
  })
}
bootstrap()
