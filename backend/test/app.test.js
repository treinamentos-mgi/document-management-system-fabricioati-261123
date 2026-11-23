const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
process.env.MAX_FILE_SIZE = '32';
const app = require('../src/app');

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('upload, listagem e download respeitam os contratos e o dono', async (context) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const repository = require('../src/repositories/documentRepository');
  const createdIds = [];
  context.after(async () => {
    for (const id of createdIds) {
      const document = repository.findById(id);
      await fs.unlink(repository.getFilePath(document)).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  });

  async function sendFile(content, owner, name = 'documento.txt') {
    const form = new FormData();
    form.append('file', new Blob([content]), name);
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST', headers: owner ? { 'X-User-Id': owner } : {}, body: form,
    });
    const body = await response.json();
    if (response.status === 201) createdIds.push(body.id);
    return { response, body };
  }

  const first = await sendFile('conteúdo', 'alice');
  assert.equal(first.response.status, 201);
  assert.deepEqual(Object.keys(first.body).sort(), ['id', 'originalName', 'owner', 'size', 'uploadedAt'].sort());
  assert.equal(first.body.originalName, 'documento.txt');
  assert.equal(first.body.owner, 'alice');
  assert.equal(first.body.size, Buffer.byteLength('conteúdo'));
  assert.ok(!Number.isNaN(Date.parse(first.body.uploadedAt)));
  const stored = repository.findById(first.body.id);
  assert.equal(path.dirname(repository.getFilePath(stored)), path.resolve(__dirname, '../storage'));
  assert.equal(await fs.readFile(repository.getFilePath(stored), 'utf8'), 'conteúdo');

  const second = await sendFile('segundo', 'alice');
  const other = await sendFile('outro', 'bob');
  const anonymous = await sendFile('padrão');
  assert.equal(second.response.status, 201);
  assert.equal(other.response.status, 201);
  assert.equal(anonymous.body.owner, 'anonymous');
  const list = await fetch(`${baseUrl}/documents`, { headers: { 'X-User-Id': 'alice' } });
  assert.equal(list.status, 200);
  assert.deepEqual((await list.json()).map((document) => document.id), [second.body.id, first.body.id]);
  const anonymousList = await fetch(`${baseUrl}/documents`);
  assert.equal(anonymousList.status, 200);
  assert.deepEqual((await anonymousList.json()).map((document) => document.id), [anonymous.body.id]);

  const download = await fetch(`${baseUrl}/documents/${first.body.id}/download`, { headers: { 'X-User-Id': 'alice' } });
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-type'), /^application\/octet-stream/);
  assert.match(download.headers.get('content-disposition'), /attachment;.*documento\.txt/);
  assert.equal(await download.text(), 'conteúdo');
  for (const id of [first.body.id, 'inexistente']) {
    const denied = await fetch(`${baseUrl}/documents/${id}/download`, { headers: { 'X-User-Id': 'bob' } });
    assert.equal(denied.status, 404);
    assert.deepEqual(await denied.json(), { error: 'Documento não encontrado.' });
  }

  const missing = await fetch(`${baseUrl}/upload`, { method: 'POST', body: new FormData() });
  assert.equal(missing.status, 400);
  assert.deepEqual(await missing.json(), { error: 'Nenhum arquivo enviado.' });
  const invalidForm = new FormData();
  invalidForm.append('unexpected', new Blob(['arquivo']), 'documento.txt');
  const invalid = await fetch(`${baseUrl}/upload`, { method: 'POST', body: invalidForm });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: 'Upload inválido.' });
  assert.equal((await sendFile('a'.repeat(32))).response.status, 201);
  const oversized = await sendFile('a'.repeat(33));
  assert.equal(oversized.response.status, 413);
  assert.deepEqual(oversized.body, { error: 'Arquivo excede o tamanho máximo permitido.' });
  await fs.unlink(repository.getFilePath(stored));
  const missingFile = await fetch(`${baseUrl}/documents/${first.body.id}/download`, { headers: { 'X-User-Id': 'alice' } });
  assert.equal(missingFile.status, 500);
  assert.deepEqual(await missingFile.json(), { error: 'Falha ao ler o arquivo.' });
});
