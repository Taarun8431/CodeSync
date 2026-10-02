'use strict';

/**
 * Storage Abstraction Layer
 *
 * Why this exists:
 *   Storing large file content as TEXT in PostgreSQL works fine at small scale.
 *   But as files grow (e.g. minified bundles, binary-ish blobs), the DB row
 *   gets heavy and every full-table scan slows down. S3/GCS is the production
 *   pattern: DB stores only a tiny "storageKey" pointer, content lives in cheap
 *   object storage.
 *
 * Two providers:
 *   - LocalProvider  (USE_S3=false, default) — reads/writes content field in DB
 *   - S3Provider     (USE_S3=true)           — reads/writes AWS S3, saves storageKey
 *
 * Usage in vfs.service.js:
 *   const storage = require('../../utils/storage');
 *   const content = await storage.read(file);
 *   const update  = await storage.write(fileId, content);   // returns Prisma data patch
 */

const USE_S3 = process.env.USE_S3 === 'true';

// ─── Local Provider ───────────────────────────────────────────────────────────
const localProvider = {
  /**
   * Read file content from the DB record (content field).
   * @param {object} file — Prisma File record
   * @returns {string}
   */
  read: async (file) => {
    return file.content || '';
  },

  /**
   * Return the Prisma data patch needed to persist content.
   * For local: just write the content column.
   * @param {string} _fileId
   * @param {string} content
   * @returns {object} Prisma update data
   */
  write: async (_fileId, content) => {
    return { content };
  },
};

// ─── S3 Provider ──────────────────────────────────────────────────────────────
let s3Provider = null;

if (USE_S3) {
  // Lazy-load AWS SDK so the package is not required in local mode
  // Run: npm install @aws-sdk/client-s3
  let S3Client, PutObjectCommand, GetObjectCommand;
  try {
    const sdk = require('@aws-sdk/client-s3');
    S3Client = sdk.S3Client;
    PutObjectCommand = sdk.PutObjectCommand;
    GetObjectCommand = sdk.GetObjectCommand;
  } catch {
    throw new Error(
      '[Storage] USE_S3=true but @aws-sdk/client-s3 is not installed. Run: npm install @aws-sdk/client-s3'
    );
  }

  const client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const BUCKET = process.env.AWS_S3_BUCKET;
  if (!BUCKET) throw new Error('[Storage] AWS_S3_BUCKET env var is required when USE_S3=true');

  /**
   * Stream-to-string helper for S3 GetObject response body.
   */
  const streamToString = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });

  s3Provider = {
    read: async (file) => {
      if (!file.storageKey) {
        // File was created before S3 migration — fall back to DB content
        return file.content || '';
      }
      try {
        const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: file.storageKey });
        const response = await client.send(cmd);
        return streamToString(response.Body);
      } catch (err) {
        console.error(`[Storage] S3 read failed for key ${file.storageKey}:`, err.message);
        // Graceful fallback to DB content if S3 read fails
        return file.content || '';
      }
    },

    write: async (fileId, content) => {
      const key = `files/${fileId}/content`;
      const cmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: content,
        ContentType: 'text/plain; charset=utf-8',
      });
      await client.send(cmd);
      // Return Prisma patch: storageKey set, content cleared (saves DB space)
      return { storageKey: key, content: '' };
    },
  };
}

// ─── Export active provider ───────────────────────────────────────────────────
const provider = USE_S3 ? s3Provider : localProvider;

module.exports = {
  /**
   * Read file content using the active storage provider.
   * @param {object} file — Prisma File record (must include content & storageKey)
   * @returns {Promise<string>}
   */
  read: (file) => provider.read(file),

  /**
   * Persist file content. Returns a Prisma-compatible data patch object.
   * @param {string} fileId
   * @param {string} content
   * @returns {Promise<object>} e.g. { content } or { storageKey, content: '' }
   */
  write: (fileId, content) => provider.write(fileId, content),

  /** Whether S3 mode is active */
  isS3: USE_S3,
};
