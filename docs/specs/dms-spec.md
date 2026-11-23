# Especificação - Document Management System

> Especificação do DMS elaborada a partir do modelo `spec-template.md`, para
> orientar o desenvolvimento guiado por especificação (Spec Driven Development).

## 1. Objetivo

Entregar um sistema web que permita enviar, listar e baixar documentos, com gestão simples por usuário e armazenamento local da aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de documentos
- Listagem de documentos
- Download de documentos
- Gestão simples por usuário (cada documento pertence a um dono)
- Validação básica de entrada e tratamento de erros
- Limite de tamanho por arquivo (padrão de 10 MB, configurável por variável de ambiente)

### Fora do escopo

- Armazenamento externo ou em nuvem
- Versionamento de documentos
- Autenticação completa (login, senha, tokens)
- Edição ou exclusão de documentos
- Persistência de metadados em banco de dados (nesta fase, em memória)
- Compartilhamento entre usuários

## 3. Requisitos funcionais

| ID    | Requisito                                                                                              |
| ----- | ------------------------------------------------------------------------------------------------------ |
| RF-01 | O usuário pode enviar um documento, informando o arquivo no campo `file` de um formulário multipart    |
| RF-02 | O usuário pode listar os documentos do seu usuário                                                     |
| RF-03 | O usuário pode baixar um documento pelo identificador, desde que seja o dono                           |
| RF-04 | O sistema rejeita uploads sem arquivo, com tamanho acima do limite configurado                         |
| RF-05 | O sistema retorna erro 404 para documento inexistente ou que não pertence ao usuário solicitante       |
| RF-06 | O usuário identifica-se pelo cabeçalho `X-User-Id`; na ausência, é usado o valor padrão `anonymous`    |

## 4. Requisitos não funcionais

| ID     | Requisito                                                                                   |
| ------ | ------------------------------------------------------------------------------------------- |
| RNF-01 | Arquivos gravados no filesystem local da aplicação (`backend/storage`) via multer `diskStorage` |
| RNF-02 | Metadados mantidos em memória nesta fase                                                    |
| RNF-03 | Configuração via variáveis de ambiente (12-Factor), incluindo `PORT`, `STORAGE_DIR` e `MAX_FILE_SIZE` |
| RNF-04 | Erros tratados nos limites do sistema: entrada HTTP e leitura/escrita de arquivos           |
| RNF-05 | Backend em Clean Architecture simples: `routes -> controllers -> services -> repositories`   |
| RNF-06 | Backend em Node.js + Express (CommonJS), testes com `node:test`, sem TypeScript              |
| RNF-07 | Frontend em React + Vite (ESM), comunicação com o backend via `fetch` no prefixo `/api`      |

## 5. Modelo de dados (metadados do documento)

| Campo        | Tipo   | Descrição                                                        |
| ------------ | ------ | ---------------------------------------------------------------- |
| id           | string | Identificador único do documento (UUID)                          |
| originalName | string | Nome original do arquivo enviado                                 |
| size         | number | Tamanho em bytes                                                 |
| uploadedAt   | string | Data/hora do upload (ISO 8601)                                   |
| owner        | string | Identificador do usuário dono (valor do cabeçalho `X-User-Id`)   |
| storedName   | string | Nome do arquivo gravado em `backend/storage` (uso interno)       |

Observações:

- Os metadados ficam em memória; reiniciar o processo limpa a lista, mas os arquivos permanecem em `backend/storage`.
- `storedName` não é exposto nas respostas da API.

## 6. Contratos de API

Prefixo base do backend: `/` (no frontend, acessado via `/api`, com proxy no Vite).
Respostas de erro seguem o formato `{ "error": "<mensagem em português>" }`.

### GET /health

- Saída `200`: `{ "status": "ok" }`

### POST /upload

- Cabeçalhos: `Content-Type: multipart/form-data`, `X-User-Id` (opcional)
- Entrada: campo `file` com o arquivo
- Saída `201`: metadados do documento criado

```json
{
  "id": "3f2a9c1e-8b7d-4e21-9a6f-1c2d3e4f5a6b",
  "originalName": "contrato.pdf",
  "size": 20480,
  "uploadedAt": "2026-11-23T10:00:00.000Z",
  "owner": "anonymous"
}
```

- Erros:
  - `400`: arquivo ausente (`"Nenhum arquivo enviado."`)
  - `413`: arquivo acima do limite (`"Arquivo excede o tamanho máximo permitido."`)
  - `500`: falha ao gravar o arquivo

### GET /documents

- Cabeçalho: `X-User-Id` (opcional)
- Saída `200`: lista de metadados dos documentos do usuário, em ordem de upload (mais recente primeiro)

```json
[
  {
    "id": "3f2a9c1e-8b7d-4e21-9a6f-1c2d3e4f5a6b",
    "originalName": "contrato.pdf",
    "size": 20480,
    "uploadedAt": "2026-11-23T10:00:00.000Z",
    "owner": "anonymous"
  }
]
```

- Erros: `500` em falha inesperada

### GET /documents/:id/download

- Cabeçalho: `X-User-Id` (opcional)
- Saída `200`: conteúdo binário do arquivo, com `Content-Type: application/octet-stream` e `Content-Disposition: attachment; filename="<originalName>"`
- Erros:
  - `404`: documento inexistente ou de outro dono (`"Documento não encontrado."`)
  - `500`: arquivo ausente no storage ou falha de leitura

## 7. Decisões arquiteturais

- Backend em Clean Architecture simples, com fluxo de dependência `routes -> controllers -> services -> repositories`. Camadas internas não conhecem camadas externas.
- `repositories/` é responsável pelo filesystem (multer `diskStorage`) e pelo armazenamento em memória dos metadados.
- `services/` concentra as regras de negócio: limite de tamanho, posse do documento e montagem dos metadados.
- `controllers/` tratam a entrada e saída HTTP e a validação básica.
- Frontend baseado em componentes funcionais com React Hooks, organizado em `components/`, `pages/` e `services/`.
- Sem provedores de armazenamento externos.
- Sem TypeScript nesta fase.
- Preferir dependências já presentes no `package.json`; `multer` é a dependência de upload prevista pelo projeto.

## 8. Plano de execução

Etapas na ordem de implementação. Cada etapa deve deixar o sistema funcionando e os testes passando.

1. **Configuração**: definir variáveis de ambiente (`PORT`, `STORAGE_DIR`, `MAX_FILE_SIZE`) com valores padrão e garantir que `backend/storage` exista na inicialização.
2. **Repositório de documentos**: implementar a gravação de arquivos com multer `diskStorage` e o armazenamento em memória dos metadados, com operações de salvar, listar por dono e buscar por id.
3. **Serviço de documentos**: implementar as regras de negócio de criação de metadados, validação de tamanho, filtragem por dono e verificação de acesso ao download.
4. **Controllers e rotas**: implementar `POST /upload`, `GET /documents` e `GET /documents/:id/download`, com tratamento de erros nos limites HTTP e mapeamento para os códigos `400`, `404`, `413` e `500`.
5. **Testes do backend**: com `node:test`, cobrir upload válido, upload sem arquivo, upload acima do limite, listagem por dono, download do próprio documento, download de documento de outro dono e documento inexistente.
6. **Frontend - serviço**: criar o módulo de comunicação com a API via `fetch` no prefixo `/api`, com funções para enviar, listar e baixar documentos.
7. **Frontend - componentes e páginas**: criar componentes de upload e de lista de documentos, reutilizáveis, e a página principal que os compõe, com exibição de mensagens de erro em português.
8. **Verificação ponta a ponta**: subir backend e frontend, executar o fluxo de upload, listagem e download, e confirmar que os arquivos aparecem em `backend/storage`.

## Verificação da especificação

- Todas as seções 1 a 8 do modelo estão preenchidas.
- Cada endpoint da seção 6 corresponde a um ou mais requisitos funcionais da seção 3.
- Os nomes dos campos do modelo de dados (seção 5) são os mesmos usados nos contratos de API (seção 6).
