const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const multer = require('multer');

const storageDirectory = path.resolve(__dirname, '../../storage');

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

function getFilePath(document) {
  return path.join(storageDirectory, document.storedName);
}

module.exports = { storage, getFilePath };
