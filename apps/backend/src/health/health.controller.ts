import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health Observability')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Comprehensive application and database health check' })
  @ApiResponse({ status: 200, description: 'Application and services are healthy' })
  @ApiResponse({ status: 503, description: 'One or more essential services are unhealthy' })
  async checkHealth(@Res() response: any) {
    let dbStatus = 'ok';
    let isHealthy = true;

    try {
      // Simple database ping query
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
      isHealthy = false;
    }

    const healthStatus = {
      status: isHealthy ? 'ok' : 'error',
      api: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };

    return response
      .status(isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
      .json(healthStatus);
  }

  @Get('db')
  @ApiOperation({ summary: 'Dedicated database connectivity probe' })
  @ApiResponse({ status: 200, description: 'Database connectivity operational' })
  async checkDbHealth(@Res() response: any) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return response.status(HttpStatus.OK).json({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'error',
        database: 'disconnected',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
