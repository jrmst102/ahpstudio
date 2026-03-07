const AWS = require('aws-sdk');

// Configure DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_KEY,
  secretAccessKey: process.env.SPACES_SECRET,
  region: process.env.SPACES_REGION || 'atl1',
});

const BUCKET_NAME = process.env.SPACES_BUCKET;

// ── Generic JSON helpers ──────────────────────────────────────────────

async function getJSON(key) {
  const params = { Bucket: BUCKET_NAME, Key: key };
  try {
    const data = await s3.getObject(params).promise();
    return JSON.parse(data.Body.toString('utf-8'));
  } catch (error) {
    if (error.code === 'NoSuchKey') return null;
    throw error;
  }
}

async function putJSON(key, obj) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(obj, null, 2),
    ContentType: 'application/json',
    ACL: 'private',
  };
  await s3.putObject(params).promise();
}

async function deleteKey(key) {
  const params = { Bucket: BUCKET_NAME, Key: key };
  await s3.deleteObject(params).promise();
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
  const params = { Bucket: BUCKET_NAME, Prefix: `users/${userId}/problems/` };
  const data = await s3.listObjectsV2(params).promise();
  return data.Contents || [];
}

async function getSignedUrl(fileKey, expiresIn = 3600) {
  const params = { Bucket: BUCKET_NAME, Key: fileKey, Expires: expiresIn };
  return s3.getSignedUrl('getObject', params);
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
