const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const service = require('../src/services/documentService');

test('serviço preserva metadados públicos, isolamento e caminho de download', () => {
  const first = service.create({ originalname: 'primeiro.txt', size: 8, filename: 'arquivo-interno-1' }, 'alice');
  const second = service.create({ originalname: 'segundo.txt', size: 4, filename: 'arquivo-interno-2' }, 'alice');
  const other = service.create({ originalname: 'outro.txt', size: 2, filename: 'arquivo-interno-3' }, 'bob');

  assert.deepEqual(Object.keys(first).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt'].sort());
  assert.equal(first.originalName, 'primeiro.txt');
  assert.equal(first.size, 8);
  assert.equal(first.owner, 'alice');
  assert.ok(!Number.isNaN(Date.parse(first.uploadedAt)));
  assert.deepEqual(service.list('alice'), [second, first]);
  assert.deepEqual(service.list('bob'), [other]);
  assert.deepEqual(service.list('anonymous'), []);
  assert.deepEqual(service.findForDownload(first.id, 'alice'), {
    path: path.resolve(__dirname, '../storage/arquivo-interno-1'),
    originalName: 'primeiro.txt',
  });
  assert.equal(service.findForDownload(first.id, 'bob'), null);
  assert.equal(service.findForDownload('inexistente', 'alice'), null);
});
