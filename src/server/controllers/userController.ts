import { NextRequest, NextResponse } from 'next/server';
import * as service from '@/server/services/userService';
import logger from '@/lib/logger';
import { requireAdmin } from '@/lib/middleware/auth';
import { createAuditLog, getClientIP, getUserAgent, AUDIT_ACTIONS } from '@/lib/utils/auditLog';
// Use service functions for any DB access to keep controller thin

export async function getUsers(request: NextRequest, adminUser: any) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const filter: any = {};
    if (role) filter.role = role;

    const users = await service.findUsers(filter);
    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    logger.error('getUsers error', { message: err.message, stack: err.stack, route: '/api/users' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function createUser(request: NextRequest, adminUser: any) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Email, password, first name, and last name are required' }, { status: 400 });
    }

    const existingUser = await service.findUserByEmail(email);
    if (existingUser) return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });

    // If frontend provided an employeeId (generated via form), use it.
    // Otherwise, let the service generate one based on system settings.
    const newUser = await service.createUser({ ...body, role: role || 'employee', isActive: true });

    const admin = await service.findUserById(adminUser.userId);
    const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'Admin';

    const usedEmployeeId = newUser.employeeId;
    await createAuditLog({
      userId: adminUser.userId,
      userName: adminName,
      userRole: adminUser.role,
      action: AUDIT_ACTIONS.USER_CREATED,
      category: 'USER',
      description: `Created new ${role || 'employee'}: ${firstName} ${lastName} (${usedEmployeeId})`,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      metadata: { newUserId: newUser._id, employeeId: usedEmployeeId, email, role: role || 'employee' },
      status: 'SUCCESS',
    });

    const { password: _, ...userResponse } = newUser.toObject();
    return NextResponse.json({ success: true, user: userResponse }, { status: 201 });
  } catch (err: any) {
    logger.error('createUser error', { message: err.message, stack: err.stack, route: '/api/users' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function updateUser(request: NextRequest, adminUser: any) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const updates = await request.json();
    delete updates.password;

    if (adminUser.role !== 'admin' && adminUser.role !== 'super-admin') {
      delete updates.role; delete updates.isActive; delete updates.leaveCredits; delete updates.employeeId;
    }

    const updatedUser = await service.updateUserById(userId, updates);
    if (!updatedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const admin = await service.findUserById(adminUser.userId);
    const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'Admin';

    await createAuditLog({
      userId: adminUser.userId,
      userName: adminName,
      userRole: adminUser.role,
      action: AUDIT_ACTIONS.USER_UPDATED,
      category: 'USER',
      description: `Updated user: ${updatedUser.firstName} ${updatedUser.lastName}`,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      metadata: { userId, updates },
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    logger.error('updateUser error', { message: err.message, stack: err.stack, route: '/api/users' });
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function deleteUser(request: NextRequest, adminUser: any) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const user = await service.findUserById(userId);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const deleted = await service.deleteUserById(userId);

    const admin = await service.findUserById(adminUser.userId);
    const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'Admin';

    await createAuditLog({
      userId: adminUser.userId,
      userName: adminName,
      userRole: adminUser.role,
      action: AUDIT_ACTIONS.USER_DELETED,
      category: 'USER',
      description: `Deleted user: ${user.firstName} ${user.lastName} (${user.email})`,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      metadata: { deletedUserId: userId, deletedUserName: `${user.firstName} ${user.lastName}`, deletedUserEmail: user.email },
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true, user: deleted });
  } catch (err: any) {
    logger.error('deleteUser error', { message: err.message, stack: err.stack, route: '/api/users' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function changePassword(request: NextRequest, adminUser: any) {
  try {
    const body = await request.json();
    const { userId, newPassword } = body;
    if (!userId || !newPassword) return NextResponse.json({ error: 'userId and newPassword are required' }, { status: 400 });

    // only admins and super-admins can change other users' passwords
    if (adminUser.role !== 'admin' && adminUser.role !== 'super-admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const updated = await service.setUserPassword(userId, newPassword);
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const admin = await service.findUserById(adminUser.userId);
    const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'Admin';

    await createAuditLog({ userId: adminUser.userId, userName: adminName, userRole: adminUser.role, action: 'USER_PASSWORD_CHANGED', category: 'USER', description: `Changed password for user ${updated._id}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { targetUserId: userId }, status: 'SUCCESS' });

    return NextResponse.json({ success: true, message: 'Password updated' });
  } catch (err: any) {
    logger.error('changePassword error', { message: err.message, stack: err.stack, route: '/api/users/change-password' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function changeOwnPassword(request: NextRequest, { params }: { params?: any } = {}) {
  try {
    const auth = await (require as any)('@/lib/middleware/auth').authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });

    const user = await service.findUserById(auth.user._id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const matches = await (user as any).comparePassword(currentPassword);
    if (!matches) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const updated = await service.setUserPassword(auth.user._id, newPassword);

    await (require as any)('@/lib/utils/auditLog').createAuditLog({ userId: auth.user._id, userName: `${user.firstName} ${user.lastName}`, userRole: auth.user.role, action: 'USER_PASSWORD_CHANGED', category: 'USER', description: 'User changed own password', ipAddress: (require as any)('@/lib/utils/auditLog').getClientIP(request), userAgent: (require as any)('@/lib/utils/auditLog').getUserAgent(request), metadata: {}, status: 'SUCCESS' });

    return NextResponse.json({ success: true, message: 'Password changed' });
  } catch (err: any) {
    logger.error('changeOwnPassword error', { message: err.message, stack: err.stack, route: '/api/users/password' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function getUserById(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await (require as any)('@/lib/middleware/auth').authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    // Users can view their own profile, admins and super-admins can view any profile
    if (auth.user._id !== params.id && auth.user.role !== 'admin' && auth.user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = await service.findUserById(params.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    logger.error('getUserById error', { message: err.message, stack: err.stack, route: '/api/users/[id]' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function patchUserById(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await (require as any)('@/lib/middleware/auth').authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    if (auth.user._id !== params.id && auth.user.role !== 'admin' && auth.user.role !== 'super-admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates = await request.json();
    delete updates.password;

    if (auth.user.role !== 'admin' && auth.user.role !== 'super-admin') {
      delete updates.role; delete updates.isActive; delete updates.leaveCredits; delete updates.employeeId;
    }

    const updatedUser = await service.updateUserById(params.id, updates);
    if (!updatedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const admin = await service.findUserById(auth.user._id);
    const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'User';

    await (require as any)('@/lib/utils/auditLog').createAuditLog({ userId: auth.user._id, userName: adminName, userRole: auth.user.role, action: (auth.user._id === params.id) ? (require as any)('@/lib/utils/auditLog').AUDIT_ACTIONS.PROFILE_UPDATED : (require as any)('@/lib/utils/auditLog').AUDIT_ACTIONS.USER_UPDATED, category: 'USER', description: `${auth.user._id === params.id ? 'Updated own profile' : `Updated user: ${updatedUser.firstName} ${updatedUser.lastName}`}`, ipAddress: (require as any)('@/lib/utils/auditLog').getClientIP(request), userAgent: (require as any)('@/lib/utils/auditLog').getUserAgent(request), metadata: { userId: params.id, updates }, status: 'SUCCESS' });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    logger.error('patchUserById error', { message: err.message, stack: err.stack, route: '/api/users/[id]' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function deleteUserById(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await (require as any)('@/lib/middleware/auth').authMiddleware(request);
    if (!auth.success || !auth.user) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    if (auth.user.role !== 'admin' && auth.user.role !== 'super-admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const user = await service.findUserById(params.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const deleted = await service.deleteUserById(params.id);
    const admin = await service.findUserById(auth.user._id);
    const adminName = admin ? `${admin.firstName} ${admin.lastName}` : 'Admin';

    await (require as any)('@/lib/utils/auditLog').createAuditLog({ userId: auth.user._id, userName: adminName, userRole: auth.user.role, action: (require as any)('@/lib/utils/auditLog').AUDIT_ACTIONS.USER_DELETED, category: 'USER', description: `Deleted user: ${user.firstName} ${user.lastName} (${user.email})`, ipAddress: (require as any)('@/lib/utils/auditLog').getClientIP(request), userAgent: (require as any)('@/lib/utils/auditLog').getUserAgent(request), metadata: { deletedUserId: params.id, deletedUserName: `${user.firstName} ${user.lastName}`, deletedUserEmail: user.email }, status: 'SUCCESS' });

    return NextResponse.json({ success: true, user: deleted });
  } catch (err: any) {
    logger.error('deleteUserById error', { message: err.message, stack: err.stack, route: '/api/users/[id]' });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
