const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documentRepository');
const documentStorage = require('../repositories/documentStorage');

function publicDocument(document) {
  const { storedName, ...metadata } = document;
  return metadata;
}

function create(file, owner) {
  const document = repository.save({
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storedName: file.filename,
  });
  return publicDocument(document);
}

function list(owner) {
  return repository.listByOwner(owner).map(publicDocument);
}

function findForDownload(id, owner) {
  const document = repository.findById(id);
  if (!document || document.owner !== owner) {
    return null;
  }
  return { path: documentStorage.getFilePath(document), originalName: document.originalName };
}

module.exports = { create, list, findForDownload };