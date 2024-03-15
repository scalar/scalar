import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
      spec: {
        content: document,
      },
    }),
  );

  await app.listen(5056, () => {
    console.log('🦁 NestJS listening at http://localhost:5056/reference');
  });
}
bootstrap();
