const documents = new Map();

function save(document) {
  documents.set(document.id, document);
  return document;
}

function listByOwner(owner) {
  return Array.from(documents.values()).reverse().filter((document) => document.owner === owner);
}

function findById(id) {
  return documents.get(id);
}

module.exports = { save, listByOwner, findById };