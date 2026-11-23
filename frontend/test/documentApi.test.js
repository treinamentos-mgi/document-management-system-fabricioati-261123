import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { listDocuments, uploadDocument, downloadDocument } from '../src/services/documentApi.js';

test('cliente utiliza o proxy, identificação e multipart', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify([{ id: '1' }]), { status: 200 }));
  assert.deepEqual(await listDocuments('alice'), [{ id: '1' }]);
  assert.equal(fetchMock.mock.calls[0].arguments[0], '/api/documents');
  assert.equal(fetchMock.mock.calls[0].arguments[1].headers['X-User-Id'], 'alice');

  const file = new File(['conteúdo'], 'teste.txt');
  await uploadDocument(file, 'alice');
  const [url, options] = fetchMock.mock.calls[1].arguments;
  assert.equal(url, '/api/upload');
  assert.equal(options.method, 'POST');
  assert.equal(options.body.get('file'), file);
  assert.equal(options.headers['X-User-Id'], 'alice');
});

test('cliente apresenta erros da API e de conexão', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'Erro de teste.' }), { status: 400 }));
  await assert.rejects(listDocuments('alice'), { message: 'Erro de teste.' });
  globalThis.fetch.mock.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(listDocuments('alice'), { message: 'Não foi possível conectar ao servidor.' });
});

test('download utiliza o identificador, usuário e nome original', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => new Response('arquivo'));
  context.mock.method(URL, 'createObjectURL', () => 'blob:teste');
  context.mock.method(URL, 'revokeObjectURL', () => {});
  const link = { click: mock.fn(), remove: mock.fn() };
  globalThis.window = { document: { createElement: () => link, body: { appendChild() {} } } };
  context.after(() => { delete globalThis.window; });
  await downloadDocument({ id: 'id/1', originalName: 'teste.txt' }, 'alice');
  assert.equal(fetchMock.mock.calls[0].arguments[0], '/api/documents/id%2F1/download');
  assert.equal(fetchMock.mock.calls[0].arguments[1].headers['X-User-Id'], 'alice');
  assert.equal(link.download, 'teste.txt');
  assert.equal(link.click.mock.callCount(), 1);
});