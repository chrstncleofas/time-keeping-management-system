import { 
  createAuditLog,
  getClientIP,
  getUserAgent,
  AUDIT_ACTIONS
} from '@/lib/utils/auditLog';

import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import * as service from '@/server/services/authService';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function login(request: Request) {
  let attemptedEmail = '';
  try {
    const { email, password } = await request.json();
    attemptedEmail = email;
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    const user = await service.findUserByEmail(email);
    if (!user) {
      await createAuditLog({ userId: '000000000000000000000000', userName: email, userRole: 'employee', action: AUDIT_ACTIONS.LOGIN_FAILED, category: 'AUTH', description: `Failed login attempt for email: ${email} - User not found`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), status: 'FAILED' });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (!user.isActive) {
      await createAuditLog({ userId: user._id, userName: `${user.firstName} ${user.lastName}`, userRole: user.role, action: AUDIT_ACTIONS.LOGIN_FAILED, category: 'AUTH', description: `Failed login attempt - Account deactivated`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), status: 'FAILED' });
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 401 });
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await createAuditLog({ userId: user._id, userName: `${user.firstName} ${user.lastName}`, userRole: user.role, action: AUDIT_ACTIONS.LOGIN_FAILED, category: 'AUTH', description: `Failed login attempt - Invalid password`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), status: 'FAILED' });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = jwt.sign({ userId: user._id.toString(), email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    await createAuditLog({ userId: user._id, userName: `${user.firstName} ${user.lastName}`, userRole: user.role, action: AUDIT_ACTIONS.LOGIN, category: 'AUTH', description: `User logged in successfully`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), metadata: { email: user.email, role: user.role }, status: 'SUCCESS' });
    const { password: _, ...userResponse } = user.toObject();
    return NextResponse.json({ success: true, token, user: userResponse });
  } catch (error: any) {
    console.error('Login error:', error);
    if (attemptedEmail) {
      try { await createAuditLog({ userId: '000000000000000000000000', userName: attemptedEmail, userRole: 'employee', action: 'SYSTEM_ERROR', category: 'SYSTEM', description: `Login system error: ${error.message}`, ipAddress: getClientIP(request), userAgent: getUserAgent(request), status: 'FAILED' }); } catch (e) { console.error('Failed to log error:', e); }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function register(request: Request) {
  try {
    const { firstName, lastName, email, password, role } = await request.json();
    if (!firstName || !lastName || !email || !password) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const user = await service.createUser({ firstName, lastName, email, password, role });
    await createAuditLog({ userId: user._id, userName: `${user.firstName} ${user.lastName}`, userRole: user.role, action: AUDIT_ACTIONS.USER_CREATED, category: 'AUTH', description: `Registered new user ${user.email}`, ipAddress: 'system', userAgent: 'system', metadata: { userId: user._id }, status: 'SUCCESS' });
    const { password: _, ...userResponse } = user.toObject();
    return NextResponse.json({ success: true, user: userResponse }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function forgotPassword(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    const result = await service.requestPasswordReset(email);
    const { success: _resultSuccess, ...resultRest } = result || {};
    return NextResponse.json({ success: true, ...resultRest });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function resetPassword(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    if (!token || !newPassword) return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    const result = await service.resetPasswordWithToken(token, newPassword);
    const { success: _resultSuccess, ...resultRest } = result || {};
    return NextResponse.json({ success: true, ...resultRest });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
