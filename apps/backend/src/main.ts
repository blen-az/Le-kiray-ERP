import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable cookies parsing
  app.use(cookieParser());

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins for dev simplicity
    credentials: true,
  });

  // Global Route Prefix
  app.setGlobalPrefix('api');

  // Input Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Le’Kiray Contractor ERP API')
    .setDescription('Multi-tenant contractor management ERP API for construction sites, heavy machinery, fuel tracking, and inventory management in Ethiopia.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 Le’Kiray ERP API is running at: http://localhost:${port}/api`);
  console.log(`📖 Swagger API Documentation is available at: http://localhost:${port}/api/docs`);
}
bootstrap();
