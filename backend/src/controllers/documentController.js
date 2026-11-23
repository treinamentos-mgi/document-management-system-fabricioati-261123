const fs = require('node:fs');
const service = require('../services/documentService');

function ownerFor(req) {
  return req.get('X-User-Id') || 'anonymous';
}

async function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  try {
    return res.status(201).json(service.create(req.file, ownerFor(req)));
  } catch (error) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(500).json({ error: 'Falha ao salvar o documento.' });
  }
}

function list(req, res) {
  try {
    return res.json(service.list(ownerFor(req)));
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao listar documentos.' });
  }
}

function download(req, res) {
  try {
    const document = service.findForDownload(req.params.id, ownerFor(req));
    if (!document) {
      return res.status(404).json({ error: 'Documento não encontrado.' });
    }

    res.set('Content-Type', 'application/octet-stream');
    return res.download(document.path, document.originalName, (error) => {
      if (error && !res.headersSent) {
        res.status(500).json({ error: 'Falha ao ler o arquivo.' });
      } else if (error) {
        res.destroy(error);
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao baixar o documento.' });
  }
}

module.exports = { upload, list, download };