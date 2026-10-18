import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express from 'express';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

/**
 * Refuse to boot in production with missing or placeholder secrets — the auth module
 * otherwise falls back to hardcoded development keys that would let anyone forge tokens.
 */
function assertProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const problems: string[] = [];
  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    const value = process.env[key];
    if (!value) problems.push(`${key} is not set`);
    else if (value.length < 32) problems.push(`${key} must be at least 32 characters`);
    else if (/change[-_]?me|your-super-secret/i.test(value)) problems.push(`${key} still uses the example placeholder`);
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    problems.push('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }
  if (!process.env.DATABASE_URL) problems.push('DATABASE_URL is not set');
  if (!process.env.CORS_ORIGINS && !process.env.FRONTEND_URL) problems.push('CORS_ORIGINS or FRONTEND_URL must be set');

  if (problems.length) {
    console.error(`❌ Refusing to start in production:\n  - ${problems.join('\n  - ')}`);
    process.exit(1);
  }
}

async function bootstrap() {
  assertProductionEnv();

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

  // Swagger Documentation Setup (disabled in production unless ENABLE_SWAGGER=true)
  const swaggerEnabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_SWAGGER === 'true';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Le’Kiray Contractor ERP API')
      .setDescription('Multi-tenant contractor management ERP API for construction sites, heavy machinery, fuel tracking, and inventory management in Ethiopia.')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 Le’Kiray ERP API is running at: http://localhost:${port}/api`);
  if (swaggerEnabled) {
    console.log(`📖 Swagger API Documentation is available at: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
