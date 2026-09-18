// Memory fallback for single-process demos without cloud configuration.
// JSON copies preserve the same read/write semantics as cloud storage.
const documents = new Map();

function getJSON(key) {
  return documents.has(key) ? JSON.parse(documents.get(key)) : null;
}

function putJSON(key, value) {
  documents.set(key, JSON.stringify(value));
}

function deleteKey(key) {
  documents.delete(key);
}

function listUserFiles(userId) {
  const prefix = `users/${userId}/problems/`;
  return [...documents.keys()].filter(key => key.startsWith(prefix)).map(Key => ({ Key }));
}

module.exports = { getJSON, putJSON, deleteKey, listUserFiles };
