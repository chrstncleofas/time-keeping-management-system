/**
 * API v1 - Uploads Route
 * @version v1
 * @since 2026-01-26
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import fs from 'fs';
import path from 'path';
import { uploadToS3, generateS3Key, isS3Configured } from '@/lib/utils/s3';

async function handler(req: NextRequest, user: { _id?: string; userId?: string }) {
  try {
    const body = await req.json();
    const { filename, data } = body as { filename?: string; data?: string };
    if (!filename || !data) return NextResponse.json({ error: 'Missing filename or data' }, { status: 400 });

    // data is expected to be a base64 data URL or raw base64
    const matches = data.match(/^data:(.+);base64,(.+)$/);
    const mime = matches ? matches[1] : 'application/octet-stream';
    const base64 = matches ? matches[2] : data;

    // Prefer S3 when configured
    if (isS3Configured()) {
      const key = generateS3Key('branding', user._id || user.userId || 'anon', filename);
      const buffer = Buffer.from(base64, 'base64');
      const res = await uploadToS3({ buffer, key, contentType: mime });
      if (!res.success) return NextResponse.json({ error: res.error || 'S3 upload failed' }, { status: 500 });
      return NextResponse.json({ url: res.url, key: res.key });
    }

    // Fallback to local public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Upload error:', error.message);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export const POST = requireAdmin(handler);
