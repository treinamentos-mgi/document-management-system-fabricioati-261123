import { useRef, useState } from 'react';
import { ArrowUpRight, FileUp, X } from 'lucide-react';
import { uploadDocument } from '../services/documentApi';

export default function UploadComponent({ user, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      await uploadDocument(file, user);
      setFile(null);
      inputRef.current.value = '';
      setMessage('Documento enviado com sucesso.');
      onUploaded();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  function clearFile() {
    setFile(null);
    inputRef.current.value = '';
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="file-picker" htmlFor="document-file">
        <span className="upload-icon"><FileUp size={23} aria-hidden="true" /></span>
        <strong>Selecionar arquivo</strong>
        <span>Escolha um documento do dispositivo</span>
      </label>
      <input ref={inputRef} className="file-input" id="document-file" type="file" disabled={uploading} onChange={(event) => { setFile(event.target.files[0] || null); setMessage(''); setError(''); }} />
      {file ? <div className="selected-file"><span title={file.name}>{file.name}</span><button type="button" onClick={clearFile} disabled={uploading} title="Remover arquivo" aria-label="Remover arquivo"><X size={16} /></button></div> : null}
      <button className="primary-button" type="submit" disabled={!file || uploading}><span>{uploading ? 'Enviando...' : 'Enviar documento'}</span><ArrowUpRight size={18} aria-hidden="true" /></button>
      {error ? <p className="message error" role="alert">{error}</p> : null}
      {message ? <p className="message success" role="status">{message}</p> : null}
    </form>
  );
}