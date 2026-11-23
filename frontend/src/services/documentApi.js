async function request(path, user, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { ...options.headers, 'X-User-Id': user },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Não foi possível concluir a operação.');
  }
  return response;
}

export async function listDocuments(user, signal) {
  const response = await request('/documents', user, { signal });
  return response.json();
}

export async function uploadDocument(file, user) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', user, { method: 'POST', body });
  return response.json();
}

export async function downloadDocument(document, user) {
  const response = await request(`/documents/${encodeURIComponent(document.id)}/download`, user);
  const url = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = url;
  link.download = document.originalName;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}