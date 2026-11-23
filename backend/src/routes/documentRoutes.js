const express = require('express');
const multer = require('multer');
const controller = require('../controllers/documentController');
const repository = require('../repositories/documentRepository');

const maxFileSize = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024);
if (!Number.isSafeInteger(maxFileSize) || maxFileSize < 1 || maxFileSize === Number.MAX_SAFE_INTEGER) {
  throw new Error('MAX_FILE_SIZE deve ser um inteiro positivo em bytes.');
}

const router = express.Router();
const upload = multer({ storage: repository.storage, limits: { fileSize: maxFileSize + 1 } }).single('file');

router.post('/upload', (req, res, next) => {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Arquivo excede o tamanho máximo permitido.' });
      }
      return res.status(400).json({ error: 'Upload inválido.' });
    }
    if (error) {
      return res.status(500).json({ error: 'Falha ao gravar o arquivo.' });
    }
    return next();
  });
}, controller.upload);
router.get('/documents', controller.list);
router.get('/documents/:id/download', controller.download);

module.exports = router;