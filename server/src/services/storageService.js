const AWS = require('aws-sdk');

// Lazy-initialise S3 so env vars are available (dotenv runs in app.js)
let s3;
function getS3() {
  if (!s3) {
    const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT);
    s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: process.env.SPACES_KEY,
      secretAccessKey: process.env.SPACES_SECRET,
      region: process.env.SPACES_REGION || 'atl1',
    });
  }
  return s3;
}

function bucket() {
  return process.env.SPACES_BUCKET;
}

// ── Generic JSON helpers ──────────────────────────────────────────────

async function getJSON(key) {
  const params = { Bucket: bucket(), Key: key };
  try {
    const data = await getS3().getObject(params).promise();
    return JSON.parse(data.Body.toString('utf-8'));
  } catch (error) {
    if (error.code === 'NoSuchKey') return null;
    throw error;
  }
}

async function putJSON(key, obj) {
  const params = {
    Bucket: bucket(),
    Key: key,
    Body: JSON.stringify(obj, null, 2),
    ContentType: 'application/json',
    ACL: 'private',
  };
  await getS3().putObject(params).promise();
}

async function deleteKey(key) {
  const params = { Bucket: bucket(), Key: key };
  await getS3().deleteObject(params).promise();
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
  const params = { Bucket: bucket(), Prefix: `users/${userId}/problems/` };
  const data = await getS3().listObjectsV2(params).promise();
  return data.Contents || [];
}

async function getSignedUrl(fileKey, expiresIn = 3600) {
  const params = { Bucket: bucket(), Key: fileKey, Expires: expiresIn };
  return getS3().getSignedUrl('getObject', params);
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
