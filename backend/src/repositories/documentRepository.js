const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(storageDirectory, { recursive: true }, (error) => {
      callback(error, storageDirectory);
    });
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

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

function getFilePath(document) {
  return path.join(storageDirectory, document.storedName);
}

module.exports = { storage, save, listByOwner, findById, getFilePath };