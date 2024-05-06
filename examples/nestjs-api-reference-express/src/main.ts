import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

import { apiReference } from '@scalar/nestjs-api-reference';

const PORT = Number(process.env.PORT || 5056);
const HOST = process.env.HOST || '0.0.0.0';

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

  await app.listen(PORT, HOST, () => {
    console.log(`🦁 NestJS listening at http://${HOST}:${PORT}/reference`);
  });
}
bootstrap();
