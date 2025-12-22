# AWS S3 Integration - Time Keeping System

## Overview
This system uses AWS S3 for storing attendance photos with automatic fallback to local storage if S3 is not configured or fails.

## Features
- ✅ **Automatic Fallback**: If S3 fails or is not configured, automatically saves to local storage
- ✅ **Error Handling**: Comprehensive error logging and handling
- ✅ **Organized Storage**: Files organized by folder/userId/timestamp structure
- ✅ **Metadata Support**: Stores metadata with each upload (userId, type, timestamp)
- ✅ **Health Monitoring**: Admin endpoint to check S3 configuration status
- ✅ **Presigned URLs**: Support for temporary access to private files

## Configuration

### Environment Variables
Add these to your `.env.local` file:

```env
# AWS S3 Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET_NAME=your-bucket-name
```

### S3 Bucket Setup
1. Create an S3 bucket in your AWS account
2. Set bucket policy to allow uploads
3. Enable CORS if accessing from browser
4. Set up IAM user with S3 permissions

## File Structure

```
src/
├── lib/
│   └── utils/
│       └── s3.ts              # S3 utility functions
└── app/
    └── api/
        ├── health/
        │   └── route.ts       # Health check endpoint
        └── time-entries/
            └── route.ts       # Uses S3 for photo uploads
```

## Usage

### Uploading Files
```typescript
import { uploadToS3, generateS3Key } from '@/lib/utils/s3';

const buffer = Buffer.from(base64Data, 'base64');
const key = generateS3Key('attendance-photos', userId, 'photo.jpg');

const result = await uploadToS3({
  buffer,
  key,
  contentType: 'image/jpeg',
  metadata: {
    userId,
    uploadedAt: new Date().toISOString(),
  },
});

if (result.success) {
  console.log('File URL:', result.url);
} else {
  console.error('Upload failed:', result.error);
}
```

### Deleting Files
```typescript
import { deleteFromS3 } from '@/lib/utils/s3';

const result = await deleteFromS3('attendance-photos/userId/timestamp-photo.jpg');
```

### Health Check
Admin can check S3 status:
```bash
GET /api/health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": {
      "status": "connected"
    },
    "s3": {
      "status": "configured",
      "bucket": "time-keeping-s3",
      "region": "ap-southeast-1"
    }
  }
}
```

## Error Handling

### S3 Upload Flow
1. Check if S3 is configured
2. If configured:
   - Attempt upload to S3
   - If fails → Log error and fallback to local storage
3. If not configured:
   - Use local storage directly
4. Return success with URL

### Error Logging
All errors are logged with context:
```typescript
console.error('❌ S3 Upload Error:', {
  message: error.message,
  code: error.code,
  key: options.key,
});
```

## Storage Structure

### S3
```
bucket-name/
└── attendance-photos/
    └── {userId}/
        └── {timestamp}-{filename}.jpg
```

### Local Fallback
```
public/
└── uploads/
    └── {userId}-{timestamp}.jpg
```

## Security

### IAM Permissions Required
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Monitoring

### Health Check Endpoint
- **URL**: `/api/health`
- **Auth**: Admin only
- **Method**: GET

Check:
- Database connection status
- S3 configuration status
- System information (memory, uptime)

## Best Practices

1. **Always check return values**
   ```typescript
   const result = await uploadToS3(options);
   if (!result.success) {
     // Handle error
   }
   ```

2. **Use generateS3Key for consistency**
   ```typescript
   const key = generateS3Key('folder', userId, filename);
   ```

3. **Include metadata for tracking**
   ```typescript
   metadata: {
     userId: user.id,
     action: 'time-in',
     timestamp: new Date().toISOString(),
   }
   ```

4. **Monitor logs for S3 errors**
   - Check console for `❌` error logs
   - Review fallback occurrences

## Troubleshooting

### Common Issues

**1. Upload fails with "Access Denied"**
- Check IAM permissions
- Verify AWS credentials in .env.local
- Ensure bucket policy allows uploads

**2. Files not accessible**
- Check bucket public access settings
- Verify CORS configuration
- Use presigned URLs for private files

**3. Slow uploads**
- Check network connectivity
- Consider using multipart upload for large files
- Monitor S3 request metrics

**4. Fallback to local storage**
- Check S3 configuration in .env.local
- Review error logs for specific issues
- Verify AWS credentials are valid

## API Reference

### uploadToS3(options)
Uploads a file to S3.

**Parameters:**
- `buffer`: Buffer - File data
- `key`: string - S3 object key
- `contentType?`: string - MIME type (default: 'application/octet-stream')
- `metadata?`: Record<string, string> - Custom metadata

**Returns:** `Promise<UploadResult>`

### deleteFromS3(key)
Deletes a file from S3.

**Parameters:**
- `key`: string - S3 object key

**Returns:** `Promise<{ success: boolean; error?: string }>`

### isS3Configured()
Checks if S3 is properly configured.

**Returns:** `boolean`

### getS3Status()
Gets current S3 configuration status.

**Returns:** `{ configured: boolean; bucket: string; region: string }`

---

**Version**: 1.0.0  
**Last Updated**: December 20, 2025
