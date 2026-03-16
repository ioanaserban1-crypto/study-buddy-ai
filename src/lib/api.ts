// Base URL for your FastAPI backend.
// In development: "http://localhost:8000"
// In production: update to your deployed API URL.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface Document {
  id: string;
  title: string;
  file_type: string;
  file_path: string;
  status: string;
  created_at: string;
}

export interface SummaryResponse {
  document_id: string;
  title: string;
  summary: string;
  generated_at: string;
}

export type SummaryType = "concise" | "detailed";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(errorBody || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Documents
export async function fetchDocuments(): Promise<Document[]> {
  return apiFetch<Document[]>("/api/documents");
}

export async function fetchDocumentById(id: string): Promise<Document> {
  return apiFetch<Document>(`/api/documents/${id}`);
}

export async function uploadDocument(title: string, file: File, fileType: string): Promise<{ id: string }> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file_type", fileType);
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: "POST",
    body: formData,
    // Don't set Content-Type — browser sets it with boundary for multipart
  });
  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(errorBody || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  await apiFetch(`/api/documents/${id}`, { method: "DELETE" });
}

export async function downloadDocumentFile(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/documents/${id}/download`);
  if (!res.ok) throw new Error("Download failed");

  const disposition = res.headers.get("Content-Disposition");
  let filename = "document";
  if (disposition) {
    const match = disposition.match(/filename="?(.+?)"?$/);
    if (match) filename = match[1];
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Summaries
export async function summarizeDocument(id: string, summaryType: SummaryType): Promise<void> {
  await apiFetch(`/api/documents/${id}/summarize`, {
    method: "POST",
    body: JSON.stringify({ summary_type: summaryType }),
  });
}

export async function fetchSummary(id: string): Promise<SummaryResponse | null> {
  try {
    return await apiFetch<SummaryResponse>(`/api/documents/${id}/summary`);
  } catch {
    return null;
  }
}

export async function regenerateSummary(id: string, summaryType: SummaryType): Promise<void> {
  await summarizeDocument(id, summaryType);
}
