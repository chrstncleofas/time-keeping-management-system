import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { authMiddleware } from '@/lib/middleware/auth';
import AuditLog from '@/lib/models/AuditLog';

export async function getAuditLogs(request: NextRequest) {
  try {
    const auth = await authMiddleware(request);
    if (auth.error || !auth.user) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    if (auth.user.role !== 'admin' && auth.user.role !== 'super-admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const query: any = {};
    if (category) query.category = category;
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) { const end = new Date(endDate); end.setHours(23,59,59,999); query.createdAt.$lte = end; }
    }
    if (search) query.$or = [{ userName: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }, { action: { $regex: search, $options: 'i' } }];

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query).populate('userId', 'firstName lastName email employeeId').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean();
    const stats = await AuditLog.aggregate([{ $facet: { byCategory: [ { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } } ], byAction: [ { $group: { _id: '$action', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 } ], recentActivity: [ { $sort: { createdAt: -1 } }, { $limit: 5 }, { $project: { userName:1, action:1, category:1, createdAt:1 } } ] } }]);

    return NextResponse.json({ logs, pagination: { page, limit, total, pages: Math.ceil(total/limit) }, stats: stats[0] || { byCategory:[], byAction:[], recentActivity:[] } });
  } catch (err: any) {
    logger.error('getAuditLogs error', { message: err.message, stack: err.stack, route: '/api/audit-logs' });
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
