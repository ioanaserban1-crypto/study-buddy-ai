// API client for the FastAPI backend
// Configure API_BASE_URL to point to your backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export interface Document {
  id: string;
  title: string;
  fileType: string;
  status: string;
  createdAt: string;
}

export interface DocumentCreateResponse {
  id: string;
  message: string;
}

export interface SummaryResponse {
  documentId: string;
  title: string;
  summary: string;
  generatedAt: string;
}

export interface SummaryStartResponse {
  message: string;
  documentId: string;
}

export type SummaryType = "concise" | "detailed";

// Documents
export async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch(`${API_BASE_URL}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function fetchDocumentById(id: string): Promise<Document> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`);
  if (!res.ok) throw new Error("Failed to fetch document");
  return res.json();
}

export async function uploadDocument(title: string, file: File, fileType: string): Promise<DocumentCreateResponse> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  formData.append("fileType", fileType);
  const res = await fetch(`${API_BASE_URL}/documents`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Failed to upload document");
  return res.json();
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function downloadDocumentFile(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/file`);
  if (!res.ok) throw new Error("Failed to download file");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Summaries
export async function summarizeDocument(id: string, summaryType: SummaryType): Promise<SummaryStartResponse> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/summarize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summaryType }),
  });
  if (!res.ok) throw new Error("Failed to start summarization");
  return res.json();
}

export async function fetchSummary(id: string): Promise<SummaryResponse> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/summary`);
  if (!res.ok) throw new Error("Summary not found");
  return res.json();
}

export async function regenerateSummary(id: string, summaryType: SummaryType): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/documents/${id}/summary`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summaryType }),
  });
  if (!res.ok) throw new Error("Failed to regenerate summary");
}
