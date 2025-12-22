import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import fs from 'fs';
import path from 'path';
import { uploadToS3, generateS3Key, isS3Configured } from '@/lib/utils/s3';

async function handler(req: NextRequest, user: any) {
  try {
    if (req.method !== 'POST') return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });

    const body = await req.json();
    const { filename, data } = body as { filename?: string; data?: string };
    if (!filename || !data) return NextResponse.json({ error: 'Missing filename or data' }, { status: 400 });

    // data is expected to be a base64 data URL or raw base64
    const matches = data.match(/^data:(.+);base64,(.+)$/);
    const mime = matches ? matches[1] : 'application/octet-stream';
    const base64 = matches ? matches[2] : data;

    // Prefer S3 when configured
    if (isS3Configured()) {
      const key = generateS3Key('branding', user._id || 'anon', filename);
      const buffer = Buffer.from(base64, 'base64');
      const res = await uploadToS3({ buffer, key, contentType: mime });
      if (!res.success) return NextResponse.json({ error: res.error || 'S3 upload failed' }, { status: 500 });
      return NextResponse.json({ url: res.url, key: res.key });
    }

    // Fallback to local public/uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));

    const url = `/uploads/${safeName}`;
    return NextResponse.json({ url });
  } catch (err: any) {
    console.error('Upload error', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export const POST = requireAdmin(async (request: NextRequest, user: any) => handler(request, user));
