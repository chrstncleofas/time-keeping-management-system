import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { getS3Status } from '@/lib/utils/s3';
import connectDB from '@/lib/db/mongodb';

export const getHealth = requireAdmin(async (request: NextRequest) => {
  try {
    let dbStatus = 'disconnected';
    let dbError = null;
    try {
      await connectDB();
      dbStatus = 'connected';
    } catch (error: any) {
      dbError = error.message;
    }

    const s3Status = getS3Status();

    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: {
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        unit: 'MB',
      },
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: { status: dbStatus, error: dbError },
        s3: { status: s3Status.configured ? 'configured' : 'not-configured', bucket: s3Status.bucket, region: s3Status.region },
      },
      system: systemInfo,
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({ success: false, status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() }, { status: 500 });
  }
});
