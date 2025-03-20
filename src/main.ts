import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@app/app.module';
import { setupSwagger } from '@config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 8787);
  const allowedOrigins = configService.get<string[]>('app.allowedOrigins', []);
  const debug = configService.get<boolean>('app.debug', false);
  
  // Configure CORS with allowed origins
  app.enableCors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  });
  
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(errors);
      },
    }),
  );

  // Setup Swagger
  setupSwagger(app);

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation is available at: ${await app.getUrl()}/api/docs`);
  
  if (debug) {
    console.log('Debug mode enabled');
    console.log(`Environment: ${configService.get('app.nodeEnv')}`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  }
}

bootstrap();