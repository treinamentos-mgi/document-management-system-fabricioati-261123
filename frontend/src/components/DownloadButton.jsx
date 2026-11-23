import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { downloadDocument } from '../services/documentApi';

export default function DownloadButton({ document, user }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      await downloadDocument(document, user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloading(false);
    }
  }

  return <div className="download-action"><button className="icon-button" type="button" onClick={handleDownload} disabled={downloading} title={`Baixar ${document.originalName}`} aria-label={`Baixar ${document.originalName}`}>{downloading ? <LoaderCircle size={18} className="spinner" /> : <Download size={18} />}</button>{error ? <span className="download-error" role="alert">{error}</span> : null}</div>;
}