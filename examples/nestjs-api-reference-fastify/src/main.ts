import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { apiReference } from '@scalar/nestjs-api-reference';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  app.use(
    '/',
    apiReference({
      withFastify: true,
      spec: {
        content: document,
      },
    }),
  );

  await app.listen(5057, () => {
    console.log('🦁 NestJS listening at http://localhost:5057/reference');
  });
}
bootstrap();
