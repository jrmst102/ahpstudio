const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint(process.env.SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.SPACES_KEY,
  secretAccessKey: process.env.SPACES_SECRET,
  region: process.env.SPACES_REGION || 'atl1',
});

const BUCKET_NAME = process.env.SPACES_BUCKET;

/**
 * Upload a decision problem file to DigitalOcean Spaces
 * @param {string} userId - User ID
 * @param {string} problemId - Problem ID
 * @param {Object} problemData - Problem data to save
 * @returns {Promise<string>} File key in the bucket
 */
async function uploadProblemFile(userId, problemId, problemData) {
  const fileKey = `users/${userId}/problems/${problemId}.AHP`;
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: JSON.stringify(problemData, null, 2),
    ContentType: 'application/json',
    ACL: 'private',
  };
  
  try {
    await s3.putObject(params).promise();
    return fileKey;
  } catch (error) {
    console.error('Error uploading file to Spaces:', error);
    throw new Error('Failed to upload problem file');
  }
}

/**
 * Download a decision problem file from DigitalOcean Spaces
 * @param {string} fileKey - File key in the bucket
 * @returns {Promise<Object>} Problem data
 */
async function downloadProblemFile(fileKey) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
  };
  
  try {
    const data = await s3.getObject(params).promise();
    return JSON.parse(data.Body.toString('utf-8'));
  } catch (error) {
    console.error('Error downloading file from Spaces:', error);
    throw new Error('Failed to download problem file');
  }
}

/**
 * Delete a decision problem file from DigitalOcean Spaces
 * @param {string} fileKey - File key in the bucket
 * @returns {Promise<void>}
 */
async function deleteProblemFile(fileKey) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
  };
  
  try {
    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting file from Spaces:', error);
    throw new Error('Failed to delete problem file');
  }
}

/**
 * List all problem files for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of file objects
 */
async function listUserFiles(userId) {
  const params = {
    Bucket: BUCKET_NAME,
    Prefix: `users/${userId}/problems/`,
  };
  
  try {
    const data = await s3.listObjectsV2(params).promise();
    return data.Contents || [];
  } catch (error) {
    console.error('Error listing files from Spaces:', error);
    throw new Error('Failed to list problem files');
  }
}

/**
 * Get a signed URL for downloading a file
 * @param {string} fileKey - File key in the bucket
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} Signed URL
 */
async function getSignedUrl(fileKey, expiresIn = 3600) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Expires: expiresIn,
  };
  
  try {
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

module.exports = {
  uploadProblemFile,
  downloadProblemFile,
  deleteProblemFile,
  listUserFiles,
  getSignedUrl,
};
