import { useEffect, useState } from 'react';
import { Archive, ArrowRight, Files, RefreshCw } from 'lucide-react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';
import './App.css';

function DocumentWorkspace({ user }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listDocuments(user, controller.signal)
      .then(setDocuments)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user, revision]);

  function refresh() {
    setRevision((current) => current + 1);
  }

  return (
    <div className="workspace">
      <aside className="upload-panel">
        <div className="section-label"><span className="label-dot" /> NOVO DOCUMENTO</div>
        <h2>Adicione ao<br />seu arquivo.</h2>
        <p className="panel-description">Mantenha seus documentos em um só lugar.</p>
        <UploadComponent user={user} onUploaded={refresh} />
        <div className="storage-note"><Archive size={16} aria-hidden="true" /> Armazenamento local</div>
      </aside>
      <section className="documents-section" aria-labelledby="documents-title">
        <div className="section-heading">
          <div>
            <div className="section-label"><span className="label-dot coral" /> SEU ESPAÇO</div>
            <h2 id="documents-title">Documentos <span className="document-count">{loading ? '—' : documents.length}</span></h2>
            <p>Seu arquivo, organizado e acessível.</p>
          </div>
          <button className="icon-button" type="button" onClick={refresh} title="Atualizar documentos" aria-label="Atualizar documentos" disabled={loading}><RefreshCw size={18} aria-hidden="true" /></button>
        </div>
        {error ? <div className="message error" role="alert">{error} <button type="button" onClick={refresh}>Tentar novamente</button></div> : null}
        {!error && <DocumentList documents={documents} loading={loading} user={user} />}
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState('anonymous');
  const [userInput, setUserInput] = useState('anonymous');

  function changeUser(event) {
    event.preventDefault();
    const nextUser = userInput.trim() || 'anonymous';
    setUserInput(nextUser);
    setUser(nextUser);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Files size={19} aria-hidden="true" /></div><div><strong>Arquivo</strong><span>DOCUMENT MANAGEMENT</span></div></div>
        <form className="user-form" onSubmit={changeUser}>
          <label htmlFor="user">USUÁRIO</label>
          <div className="user-control"><input id="user" value={userInput} onChange={(event) => setUserInput(event.target.value)} maxLength={100} /><button type="submit" title="Selecionar usuário" aria-label="Selecionar usuário"><ArrowRight size={17} aria-hidden="true" /></button></div>
        </form>
      </header>
      <main className="main-content">
        <div className="page-heading"><div><div className="breadcrumb">ARQUIVO <span>/</span> DOCUMENTOS</div><h1>Meus documentos<span>.</span></h1></div><div className="page-index">01 <span>/ DOCUMENTOS</span></div></div>
        <DocumentWorkspace key={user} user={user} />
      </main>
      <footer><span>ARQUIVO <span className="footer-dot">●</span> DMS</span><span>SEU ESPAÇO DE DOCUMENTOS</span></footer>
    </div>
  );
}
