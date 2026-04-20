import { prisma } from '@/lib/prisma'
import { apiResponse } from '@/lib/utils'

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    return apiResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        database: 'connected',
        api: 'running',
      },
    }, 'System is healthy')
  } catch (error) {
    return apiResponse({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    }, 'System is unhealthy', 503)
  }
}
