import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { requireAuth } from '@/lib/middleware/auth';
import SystemSettings from '@/lib/models/SystemSettings';
import connectDB from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import { createAuditLog, getClientIP, getUserAgent, AUDIT_ACTIONS } from '@/lib/utils/auditLog';

const SETTINGS_ID = '000000000000000000000001';

export async function getSettings(request: NextRequest, user: any) {
  try {
    await connectDB();
    let settings = await SystemSettings.findById(SETTINGS_ID);
    if (!settings) {
      // If no authenticated user (public read), set a fallback lastUpdatedBy
      const lastUpdatedBy = user && user.userId ? new mongoose.Types.ObjectId(user.userId) : new mongoose.Types.ObjectId('000000000000000000000000');
      settings = await SystemSettings.create({ _id: SETTINGS_ID, enableLeaveCreditsManagement: true, enableFileLeaveRequest: true, enableVerbalAgreements: true, allowEarlyOut: true, allowHalfDay: true, allowLateIn: true, lastUpdatedBy, lastUpdatedAt: new Date() });
    }
    return NextResponse.json(settings);
  } catch (err: any) {
    logger.error('getSettings error', { message: err.message, stack: err.stack, route: '/api/system-settings' });
    return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 });
  }
}

export async function updateSettings(request: NextRequest, user: any) {
  try {
    if (user.role !== 'super-admin') return NextResponse.json({ error: 'Only super admins can modify system settings' }, { status: 403 });
    const updates = await request.json();
    logger.info('updateSettings called', { updates, userId: user.userId });
    await connectDB();
    let settings = await SystemSettings.findById(SETTINGS_ID);
    if (!settings) settings = new SystemSettings({ _id: SETTINGS_ID, lastUpdatedBy: new mongoose.Types.ObjectId(user.userId) });
    const keys = ['enableLeaveCreditsManagement','enableFileLeaveRequest','enableVerbalAgreements','allowEarlyOut','allowHalfDay','allowLateIn','employeeIdPrefix','employeeIdUppercase','employeeIdPadding','employeeIdDelimiter','companyName','logoUrl','faviconUrl','primaryColor','accentColor','sidebarBg','sidebarText','sidebarActiveBg','sidebarHoverBg','buttonBg','buttonText','headerBg','headerText','authCardBg','authBackdropBg','cardBg','footerText'];
    keys.forEach(k => { if (typeof (updates as any)[k] !== 'undefined') (settings as any)[k] = (updates as any)[k]; });
    settings.lastUpdatedBy = new mongoose.Types.ObjectId(user.userId);
    settings.lastUpdatedAt = new Date();
    await settings.save();
    // Reload the document as a plain object to ensure all fields are returned to the client
    const fresh = await SystemSettings.findById(SETTINGS_ID).lean();
    logger.info('system settings saved', { id: settings._id.toString(), sidebarBg: (settings as any).sidebarBg, sidebarText: (settings as any).sidebarText, footerText: (fresh as any)?.footerText });
    const userDetails = await User.findById(user.userId);
    const userName = userDetails ? `${userDetails.firstName} ${userDetails.lastName}` : 'Admin';
    await createAuditLog({ userId: user.userId, userName, userRole: user.role, action: AUDIT_ACTIONS.SETTINGS_UPDATED, category: 'SYSTEM', description: `Updated system settings: ${JSON.stringify(updates)}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), status: 'SUCCESS' });
    return NextResponse.json(fresh || settings);
  } catch (err: any) {
    logger.error('updateSettings error', { message: err.message, stack: err.stack, route: '/api/system-settings' });
    return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 });
  }
}
