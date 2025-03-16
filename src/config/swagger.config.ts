import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Dextract-fi API')
    .setDescription('The Dextract-fi API documentation')
    .setVersion('1.0')
    .addTag('tokens', 'Token operations')
    .addTag('prices', 'Price operations')
    .addTag('swaps', 'Swap operations')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}