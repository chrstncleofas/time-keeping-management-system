import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

// Validate required environment variables
const validateS3Config = () => {
  const required = {
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required S3 configuration: ${missing.join(', ')}`);
  }

  return required as Record<string, string>;
};

// Initialize S3 client with validation
let s3Client: S3Client | null = null;

const getS3Client = (): S3Client => {
  if (!s3Client) {
    try {
      const config = validateS3Config();
      
      s3Client = new S3Client({
        region: config.AWS_REGION,
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
      });
    } catch (error) {
      throw error;
    }
  }
  return s3Client;
};

interface UploadOptions {
  buffer: Buffer;
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(options: UploadOptions): Promise<UploadResult> {
  try {
    const client = getS3Client();
    const bucketName = process.env.AWS_S3_BUCKET_NAME!;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: options.key,
      Body: options.buffer,
      ContentType: options.contentType || 'application/octet-stream',
      Metadata: options.metadata,
    });

    await client.send(command);

    // Construct the public URL
    const url = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${options.key}`;
    return {
      success: true,
      url,
      key: options.key,
    };
  } catch (error: any) {
    console.error('❌ S3 Upload Error:', {
      message: error.message,
      code: error.code,
      key: options.key,
    });

    return {
      success: false,
      error: error.message || 'Failed to upload to S3',
    };
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getS3Client();
    const bucketName = process.env.AWS_S3_BUCKET_NAME!;

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    await client.send(command);
    return { success: true };
  } catch (error: any) {
    console.error('❌ S3 Delete Error:', {
      message: error.message,
      code: error.code,
      key,
    });

    return {
      success: false,
      error: error.message || 'Failed to delete from S3',
    };
  }
}

/**
 * Generate a pre-signed URL for temporary access to a private file
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const client = getS3Client();
    const bucketName = process.env.AWS_S3_BUCKET_NAME!;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const url = await getSignedUrl(client, command, { expiresIn });

    return {
      success: true,
      url,
    };
  } catch (error: any) {
    console.error('❌ S3 Presigned URL Error:', {
      message: error.message,
      code: error.code,
      key,
    });

    return {
      success: false,
      error: error.message || 'Failed to generate presigned URL',
    };
  }
}

/**
 * Check if S3 is properly configured
 */
export function isS3Configured(): boolean {
  try {
    validateS3Config();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get S3 configuration status for health checks
 */
export function getS3Status() {
  const isConfigured = isS3Configured();
  
  return {
    configured: isConfigured,
    bucket: process.env.AWS_S3_BUCKET_NAME || 'Not configured',
    region: process.env.AWS_REGION || 'Not configured',
  };
}

/**
 * Helper to generate consistent S3 keys
 */
export function generateS3Key(
  folder: string,
  userId: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${folder}/${userId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Helper to extract key from S3 URL
 */
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
}
