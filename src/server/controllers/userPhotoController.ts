import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';
import User from '@/lib/models/User';
import { authMiddleware } from '@/lib/middleware/auth';
import { uploadToS3, deleteFromS3, extractS3KeyFromUrl, isS3Configured } from '@/lib/utils/s3';
import { createAuditLog, getClientIP, getUserAgent, AUDIT_ACTIONS } from '@/lib/utils/auditLog';

export async function uploadPhoto(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authMiddleware(request);
    if (authResult.error || !authResult.user) return NextResponse.json({ error: authResult.error || 'Unauthorized' }, { status: 401 });

    if (authResult.user._id !== params.id && authResult.user.role !== 'admin' && authResult.user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { photoBase64 } = await request.json();
    if (!photoBase64) return NextResponse.json({ error: 'Photo is required' }, { status: 400 });

    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    try {
      if (user.photoUrl && user.photoUrl.includes('s3.amazonaws.com')) {
        const oldKey = extractS3KeyFromUrl(user.photoUrl);
        if (oldKey) await deleteFromS3(oldKey);
      }
    } catch (e) {
      // ignore delete errors
    }

    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const sanitizedLastName = user.lastName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const filename = `${user.employeeId || user._id}-${sanitizedLastName}-${timestamp}.jpg`;

    if (!isS3Configured()) return NextResponse.json({ error: 'Cloud storage not configured. Please contact administrator.' }, { status: 500 });

    const s3Key = `profile-photos/${filename}`;
    const uploadResult = await uploadToS3({ buffer, key: s3Key, contentType: 'image/jpeg', metadata: { userId: params.id, employeeId: user.employeeId || '', lastName: user.lastName, type: 'profile-photo', uploadedAt: new Date().toISOString() } });
    if (!uploadResult.success) return NextResponse.json({ error: 'Failed to upload photo. Please try again.' }, { status: 500 });

    const photoUrl = uploadResult.url!;
    user.photoUrl = photoUrl; await user.save();

    const actionUser = await User.findById(authResult.user._id);
    const actionUserName = actionUser ? `${actionUser.firstName} ${actionUser.lastName}` : 'User';
    await createAuditLog({ userId: authResult.user._id, userName: actionUserName, userRole: authResult.user.role, action: AUDIT_ACTIONS.PROFILE_UPDATED, category: 'USER', description: `Updated profile photo${authResult.user._id !== params.id ? ` for ${user.firstName} ${user.lastName}` : ''}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { userId: params.id, photoUrl, storage: isS3Configured() ? 's3' : 'local' }, status: 'SUCCESS' });

    return NextResponse.json({ success: true, photoUrl, message: 'Profile photo updated successfully' });
  } catch (err: any) {
    logger.error('uploadPhoto error', { message: err.message, stack: err.stack, route: '/api/users/[id]/upload-photo' });
    return NextResponse.json({ error: err.message || 'Failed to upload photo' }, { status: 500 });
  }
}
