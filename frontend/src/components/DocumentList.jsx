import { FileText, FolderOpen } from 'lucide-react';
import DownloadButton from './DownloadButton';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, loading, user }) {
  if (loading) return <div className="empty-state" role="status">Carregando documentos...</div>;
  if (!documents.length) return <div className="empty-state"><span className="empty-icon"><FolderOpen size={24} aria-hidden="true" /></span><strong>Nenhum documento ainda</strong><span>Os documentos enviados aparecerão aqui.</span></div>;

  return (
    <div className="document-list">
      <div className="list-header"><span>NOME DO DOCUMENTO</span><span>DATA DE ENVIO</span><span>TAMANHO</span><span className="sr-only">Download</span></div>
      {documents.map((document) => (
        <div className="document-row" key={document.id}>
          <div className="document-name"><span className="file-icon"><FileText size={20} aria-hidden="true" /></span><div><strong title={document.originalName}>{document.originalName}</strong><span>Documento</span></div></div>
          <span className="document-date">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(document.uploadedAt))}</span>
          <span className="document-size">{formatSize(document.size)}</span>
          <DownloadButton document={document} user={user} />
        </div>
      ))}
    </div>
  );
}