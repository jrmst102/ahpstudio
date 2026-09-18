const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl: s3GetSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { isDemoMode, hasSharedStorage } = require('../config/demo');
const demoStorage = require('./demoStorage');

const useMemory = () => isDemoMode() && !hasSharedStorage();
// Shared demos survive restarts and requests routed to different instances.
// Keep every demo document separate from account-based storage.
const storageKey = key => isDemoMode() ? `demo/${key}` : key;

// Lazy-initialise S3 so env vars are available (dotenv runs in app.js)
let s3;
function getS3() {
  if (!s3) {
    s3 = new S3Client({
      endpoint: process.env.SPACES_ENDPOINT,
      region: process.env.SPACES_REGION || 'atl1',
      credentials: {
        accessKeyId: process.env.SPACES_KEY,
        secretAccessKey: process.env.SPACES_SECRET,
      },
      forcePathStyle: false,
    });
  }
  return s3;
}

function bucket() {
  return process.env.SPACES_BUCKET;
}

// ── Generic JSON helpers ──────────────────────────────────────────────

async function getJSON(key) {
  if (useMemory()) return demoStorage.getJSON(key);
  try {
    const data = await getS3().send(new GetObjectCommand({ Bucket: bucket(), Key: storageKey(key) }));
    const body = await data.Body.transformToString('utf-8');
    return JSON.parse(body);
  } catch (error) {
    if (error.name === 'NoSuchKey') return null;
    throw error;
  }
}

async function putJSON(key, obj) {
  if (useMemory()) return demoStorage.putJSON(key, obj);
  await getS3().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: storageKey(key),
    Body: JSON.stringify(obj, null, 2),
    ContentType: 'application/json',
    ACL: 'private',
  }));
}

async function deleteKey(key) {
  if (useMemory()) return demoStorage.deleteKey(key);
  await getS3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: storageKey(key) }));
}

// ── Problem file helpers ──────────────────────────────────────────────

async function uploadProblemFile(userId, problemId, problemData) {
  const fileKey = `users/${userId}/problems/${problemId}.AHP`;
  await putJSON(fileKey, problemData);
  return fileKey;
}

async function downloadProblemFile(fileKey) {
  const data = await getJSON(fileKey);
  if (data === null) throw new Error('Problem file not found');
  return data;
}

async function deleteProblemFile(fileKey) {
  await deleteKey(fileKey);
}

async function listUserFiles(userId) {
  if (useMemory()) return demoStorage.listUserFiles(userId);
  const data = await getS3().send(new ListObjectsV2Command({
    Bucket: bucket(),
    Prefix: storageKey(`users/${userId}/problems/`),
  }));
  return data.Contents || [];
}

async function getSignedUrl(fileKey, expiresIn = 3600) {
  if (isDemoMode()) {
    const data = await downloadProblemFile(fileKey);
    return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
  }
  const command = new GetObjectCommand({ Bucket: bucket(), Key: storageKey(fileKey) });
  return s3GetSignedUrl(getS3(), command, { expiresIn });
}

module.exports = {
  getJSON,
  putJSON,
  deleteKey,
  uploadProblemFile,
  downloadProblemFile,
  deleteProblemFile,
  listUserFiles,
  getSignedUrl,
};
