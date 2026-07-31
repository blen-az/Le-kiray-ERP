import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express from 'express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Graceful Shutdown Hooks
  app.enableShutdownHooks();

  // Helmet HTTP Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Request Body Size Limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Enable Cookies Parsing
  app.use(cookieParser());

  // Production-Safe Dynamic CORS Setup
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or matching whitelisted origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error(`CORS Error: Origin ${origin} not allowed by CORS security policy`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

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
